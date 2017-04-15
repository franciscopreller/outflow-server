// -------------------------------------------------------------------------------------
// Telnet IAC Options
// ==================
// Telnet clients will send IAC codes which should instruct the client on a number
// of options available/ or negotiations the client can do with the server.
//
// Read more:
//   - http://pcmicro.com/NetFoss/telnet.html
//   - https://www.iana.org/assignments/telnet-options/telnet-options.xhtml
//   - https://www.gammon.com.au/scripts/showrelnote.php?version=4.48&productid=0
//   - https://blog.ikeran.org/?p=129
// -------------------------------------------------------------------------------------

exports.TELNET_ECHO = 1; // output echo on/off
exports.TELNET_SGA = 3; // supress go ahead
exports.TELNET_TERMTYPE = 24; // send terminal type
exports.TELNET_END_OF_RECORD = 25; // end of record
exports.TELNET_NEW_ENVIRON = 39; // New environment
exports.TELNET_NAWS = 31; // negotiate about window size
exports.TELNET_MSSP = 70; // mud server status protocol
exports.TELNET_MCCP_V1 = 85; // mud client compression protocol v1
exports.TELNET_MCCP_V2 = 86; // mud client compression protocol v2
exports.TELNET_MSP = 90; // mud sound protocol
exports.TELNET_MXP = 91; // mud extension protocol
exports.TELNET_ZMP = 93; // zenith mud protocol
exports.TELNET_AARDWOLF_OPTS = 102; // used by Aardwolf MUD and some MUSHClient plugins
exports.TELNET_ATCP = 200; // Achaea telnet client options
exports.TELNET_GMCP = 201; // GMCP (It's huge) ---> Read more: http://www.ironrealms.com/gmcp-doc
exports.TELNET_EOR = 239; // End of record indicated by IAC EOR 2-octet sequence. The code for EOR is 239 (decimal).
exports.TELNET_GA = 249; // go ahead

// -------------------------------------------------------------------------------------
// Web-socket outgoing actions for the web client
exports.SESSION_HIDE_PROMPT_REQUESTED = 'SESSION_HIDE_PROMPT_REQUESTED';
exports.SESSION_SHOW_PROMPT_REQUESTED = 'SESSION_SHOW_PROMPT_REQUESTED';
exports.SESSION_DO_GO_AHEAD = 'SESSION_DO_GO_AHEAD';
