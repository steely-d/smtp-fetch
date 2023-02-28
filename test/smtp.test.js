"use strict";

const net = require("net");
const SMTP = require("../src");
const { SMTPError } = require("../src/error");

const DUMMY_PORT = 1025;

const createTestServer = (port) => {
  let server = net.createServer();
  server.start = () => new Promise((r) => server.listen(port, r));
  server.stop = () => new Promise((r) => server.close(r));

  return server;
};

describe("connect", () => {
  let client, server;

  beforeEach(() => {
    client = new SMTP("127.0.0.1", DUMMY_PORT);
  });

  afterEach(async () => {
    client.close();
    await server.stop();
  });

  it("should connect to the SMTP server", async () => {
    server = createTestServer(DUMMY_PORT);
    server.on("connection", (sock) => {
      sock.write("220 mx.test.com ESMTP\r\n");
    });
    await server.start();

    const result = await client.connect();

    expect(result.code).toBe(220);
    expect(result.message).toBe("mx.test.com ESMTP");
  });

  it("should throw when not 220", async () => {
    server = createTestServer(DUMMY_PORT);
    server.on("connection", (sock) => {
      sock.write("300 mx.test.com ESMTP\r\n");
    });
    await server.start();

    await expect(client.connect()).rejects.toThrowError(
      new SMTPError("unexpected code: 300")
    );
  });
});
