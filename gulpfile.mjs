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
import typescript from "@rollup/plugin-typescript";
import terser from "gulp-terser";

import gulpTypescript from "gulp-typescript";

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
import "dotenv/config";

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
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
      }),
      eslint({ throwOnError: true }),
      rollupBabel({ 
        babelHelpers: "bundled",
        extensions: [".js", ".ts"],
        exclude: "node_modules/**"
      }),
      nodeResolve({
        extensions: [".js", ".ts"]
      }),
      commonjs(),
    ],
  };
};

const clean = () => del(["./dist", "./lib"]);

const jsMax = () =>
  rollupStream({ ...rollupConfig("./src/index.ts", true), cache })
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
  rollupStream(rollupConfig("./src/tiny.ts"))
    .pipe(source("tiny-mde.tiny.js"))
    .pipe(buffer())
    .pipe(terser())
    .pipe(gulp.dest("./dist"))
    .pipe(size({ showFiles: true }));

const js = gulp.series(jsMax, jsTiny);

const transpile = () => {
  const tsProject = gulpTypescript.createProject('tsconfig.json', {
    module: 'commonjs',
    declaration: true,
    outDir: './lib',
  });
  
  return gulp
    .src("./src/**/*.ts")
    .pipe(tsProject())
    .pipe(gulp.dest("./lib"));
};

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
  gulp.watch("./src/**/*.ts", jsMax);
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
      path.join(".", "src", "svg", "svg.ts"),
      `const svg: Record<string, string> = {\n  ${values.join(",\n  ")}\n};\n\nexport default svg;`,
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

const bumpVersion = async () => {
  await execPromise("npm version patch --no-git-tag-version");
  await execPromise(`git commit -am 'Bump version for release'`);
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

const gitCheckIfTagExists = async () => {
  const { version } = JSON.parse(await readfile("package.json"));
  const tagName = `v${version}`;

  return new Promise((resolve, reject) => {
    child_process.exec(`git tag -l "${tagName}"`, (err, stdout) => {
      if (err) reject(err);
      const existingTag = stdout.trim();
      if (existingTag) {
        reject(
          `Tag ${tagName} already exists. Please bump the version before releasing.`
        );
      } else {
        resolve();
      }
    });
  });
};

const gitCheckIfBranchDirty = async () => {
  return new Promise((resolve, reject) => {
    child_process.exec("git status --porcelain", (err, stdout) => {
      if (err) reject(err);
      const uncommittedChanges = stdout.trim();
      if (uncommittedChanges) {
        reject(
          `There are uncommitted changes in the working directory. Please commit or stash them before releasing.`
        );
      } else {
        resolve();
      }
    });
  });
};

const gitPushTag = async () => {
  const { version } = JSON.parse(await readfile("package.json"));
  const tagName = `v${version}`;

  await execPromise(`git tag ${tagName}`);
  await execPromise(`git push`);
  return execPromise(`git push origin ${tagName}`);
};


const build = gulp.series(clean, transpile, svg, js, css, html);

const dev = gulp.series(clean, svg, jsMax, css, html, watch);


const release = gulp.series(
  gitCheckBranch,
  gitCheckIfTagExists,
  gitCheckIfBranchDirty,
  gitPushTag,
);

const releasePatch = gulp.series(gitCheckBranch, bumpVersion, release);

export { dev, releasePatch, release, };

export default build;
