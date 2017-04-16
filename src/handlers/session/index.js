const constants = require('./constants');
const mqUtils = require('../../lib/utils');
const actions = require('./actions');
const utils = require('./utils');
const debug = require('../../lib/debug');

module.exports = {

  /**
   * The SESSION_CONNECT is the initializer for a session, it will attempt connection to the telnet server
   * and set up all of it's own internal queues, which are then able to emit back to the telnet
   * session handler to pass-through back to the web-socket -> client.
   *
   * @param context
   * @param redis
   * @param data
   */
  [constants.SESSION_CONNECT]: (context, redis, data) => {
    const { socketId, payload, userId } = data;
    const { host, port, uuid } = payload;
    const TelnetSession = require('../../lib/telnet');
    const telnetSession = new TelnetSession({ host, port, uuid, socketId }, context);

    // Connection to session
    debug(`[${userId}] Initiating new session connection to ${host}:${port}`);

    // Start telnet session
    const session = telnetSession.start();

    // Handle connected status from server
    session.on('connected', () => {
      utils.setSession(redis, userId, { uuid, host, port });
      mqUtils.reply(context, socketId, actions.sessionConnected({ uuid }));
      debug(`[${userId}] Connected to ${host}:${port}`);
    });

    // Handle closed status from server
    session.on('closed', () => {
      utils.unsetSession(redis, userId, uuid);
      mqUtils.reply(context, socketId, actions.sessionDisconnected({ uuid }));
      debug(`[${userId}] Disconnected from ${host}:${port}`);
    });

    // Pass through events
    session.on('error', (error) => mqUtils.reply(context, socketId, actions.sessionError({ uuid, error })));
    session.on('data', (segments) => mqUtils.reply(context, socketId, actions.sessionOutput({ segments, uuid })));
    session.on('prompt', (segments) => mqUtils.reply(context, socketId, actions.sessionPrompt({ segments, uuid })));
  },

  /**
   * SESSION_DISCONNECT is emitted from the client, here we simply append the right UUID so we can reach
   * the right telnet session queue. This way we have a single point of entry for queues, and can handle
   * them from here in a PUB/SUB manner, rather than PUSH/PULL.
   *
   * @param context
   * @param redis
   * @param data
   */
  [constants.SESSION_DISCONNECT]: (context, redis, data) => {
    mqUtils.publish(context, `${constants.SESSION_DISCONNECT}.${data.payload.uuid}`, data.payload.uuid);
  },

  /**
   * SESSION_COMMAND directives are emitted from the client when the user wants to send commands back
   * to the telnet session. Same as SESSION_DISCONNECT, it is preferred to have a single point of entry
   * here, and PUB/SUB directly into the telnet session queues.
   *
   * @param context
   * @param redis
   * @param data
   */
  [constants.SESSION_COMMAND]: (context, redis, data) => {
    mqUtils.publish(context, `${constants.SESSION_COMMAND}.${data.payload.uuid}`, data.payload.command);
  },

};
