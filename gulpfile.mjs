import gulp from "gulp";

import size from "gulp-size";
import rename from "gulp-rename";
import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";

import rollupStream from "@rollup/stream";
import { babel as rollupBabel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { eslint } from "rollup-plugin-eslint";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "gulp-terser";

import gulpBabel from "gulp-babel";

import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import postcss_import from "postcss-import";
import cssnano from "cssnano";

import jestCLI from "jest-cli";

import { deleteAsync as del } from "del";
import fs from "fs";
import path from "path";

import util from "util";
import child_process from "node:child_process";
import readline from "node:readline/promises";
import "dotenv/config";
import process from "process";

import { Octokit } from "@octokit/rest";

const readfile = util.promisify(fs.readFile);
const writefile = util.promisify(fs.writeFile);

let cache;

const rollupConfig = (inputFile, sourcemaps = false) => {
  return {
    input: inputFile,
    output: {
      format: "umd",
      name: "TinyMDE",
      sourcemap: sourcemaps,
    },
    plugins: [
      eslint({ throwOnError: true }),
      rollupBabel({ babelHelpers: "bundled" }),
      nodeResolve(),
      commonjs(),
    ],
  };
};

const clean = () => del(["./dist", "./lib"]);

const jest = () => jestCLI.run([]);

const jsMax = () =>
  rollupStream({ ...rollupConfig("./src/index.js", true), cache })
    .on("bundle", (bundle) => {
      cache = bundle;
    })
    .pipe(source("tiny-mde.js"))
    .pipe(buffer())
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest("./dist"))
    .pipe(rename("tiny-mde.min.js"))
    .pipe(terser())
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest("./dist"));
const jsTiny = () =>
  rollupStream(rollupConfig("./src/tiny.js"))
    .pipe(source("tiny-mde.tiny.js"))
    .pipe(buffer())
    .pipe(terser())
    .pipe(gulp.dest("./dist"))
    .pipe(size({ showFiles: true }));

const js = gulp.series(jsMax, jsTiny);

const transpile = () =>
  gulp
    .src("./src/**/*.js")
    .pipe(gulpBabel({ plugins: ["@babel/plugin-transform-modules-commonjs"] }))
    .pipe(gulp.dest("./lib"));

const html = () => gulp.src("./src/html/*.html").pipe(gulp.dest("./dist"));

const css = () =>
  gulp
    .src("./src/css/index.css")
    .pipe(postcss([postcss_import(), autoprefixer()]))
    .pipe(rename("tiny-mde.css"))
    .pipe(gulp.dest("./dist"))
    .pipe(postcss([cssnano()]))
    .pipe(rename("tiny-mde.min.css"))
    .pipe(gulp.dest("./dist"));

const watch = () => {
  gulp.watch("./src/**/*.svg", svg);
  gulp.watch("./src/**/*.js", jsMax);
  gulp.watch("./src/**/*.css", css);
  gulp.watch("./src/**/*.html", html);
};

const svg = () => {
  const dirEntries = fs.readdirSync(path.join(".", "src", "svg"), {
    withFileTypes: true,
  });
  let promises = [];
  for (let entry of dirEntries) {
    if (entry.isFile() && entry.name.match(/\.svg$/i)) {
      let fn = entry.name;
      promises.push(
        readfile(path.join(".", "src", "svg", fn), { encoding: "utf8" }).then(
          (buffer) => {
            // console.log(entry.name + ': ' + buffer.toString().replace(/([`\$\\])/g, '\\$1'));
            return `${fn.replace(/^(.*)\.svg$/i, "$1")}: \`${buffer
              .toString()
              .replace(/([`$\\])/g, "\\$1")}\``;
          }
        )
      );
    }
  }
  return Promise.all(promises).then((values) =>
    writefile(
      path.join(".", "src", "svg", "svg.js"),
      `const svg = {\n  ${values.join(",\n  ")}\n};\n\nexport default svg;`,
      { encoding: "utf8" }
    )
  );
};

const execPromise = (command) => {
  const cp = child_process.exec(command, { shell: "/bin/zsh" });
  cp.stdout.on("data", (data) => {
    console.log(data.toString());
  });
  cp.stderr.on("data", (data) => {
    console.error(data.toString());
  });
  return new Promise((resolve, reject) => {
    cp.on("exit", (code) => (code ? reject(code) : resolve()));
  });
};

const bumpVersion = () => {
  return execPromise("npm version patch");
};

const npmRelease = async () => {
  const otp = await readline
    .createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    .question("Please enter a one-time password for NPM");
  return execPromise(`npm publish --otp=${otp}`);
};

const gitCheckBranch = async () => {
  return new Promise((resolve, reject) => {
    child_process.exec("git branch --show-current", (err, stdout) => {
      if (err) reject(err);
      const branch = stdout.trim();
      if (branch === "main") {
        resolve();
      } else {
        reject(
          `Releases can only be made from the main branch, current branch is ${branch}`
        );
      }
    });
  });
};

const gitPush = () => {
  return execPromise("git push");
};

const ghRelease = async () => {
  const { version } = JSON.parse(await readfile("package.json"));

  const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });
  return octokit.repos.createRelease({
    owner: "jefago",
    repo: "tiny-markdown-editor",
    tag_name: `v${version}`, // The name of the tag
    name: `v${version}`,
    body: "",
    draft: false,
    prerelease: false,
  });
};

const build = gulp.series(clean, svg, js, css, html);

const dev = gulp.series(clean, svg, jsMax, css, html, watch);

const test = gulp.series(build, jest);

const prepublish = gulp.series(build, jest, transpile);

const release = gulp.series(
  gitCheckBranch,
  prepublish,
  npmRelease,
  gitPush,
  ghRelease
);

const releasePatch = gulp.series(gitCheckBranch, bumpVersion, release);

export { dev, test, svg, prepublish, releasePatch, release };

export default build;
// exports.default = build;
// exports.dev = dev;
// exports.test = test;
// exports.svg = svg;
// exports.prepublish = prepublish;
