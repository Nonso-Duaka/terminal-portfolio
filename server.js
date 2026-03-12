#!/usr/bin/env node
/**
 * Main entry point - runs both SSH and Web servers.
 */

require('./src/ssh-server');
require('./src/web-server');
