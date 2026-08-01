const PORT = 8880;
// Loopback only - the test server has no reason to be reachable off-box. Kept
// as an IP rather than "localhost" so the server and the browsers agree on a
// family: "localhost" can resolve to ::1 on one side and 127.0.0.1 on the other.
const HOST = '127.0.0.1';
exports.PORT = PORT;
exports.HOST = HOST;
