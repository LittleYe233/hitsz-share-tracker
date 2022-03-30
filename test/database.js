// Note: You need chalk@4.1.2. See https://stackoverflow.com/a/70425265/12002560
const chalk = require('chalk');
const database = require('../utils/common/database');

/* Custom log styles */
const log = console.log;
const info = chalk.green;
const error = chalk.red;
const INFO = info('INFO');
const ERROR = error('ERR');

(async () => {

  /* Active Clients database */
  log(INFO, '=== Active Clients database ===');

  const clientParams = {
    host: '127.0.0.1',
    port: 3306,
    user: 'test',
    pass: 'test',
    db: 'test',
    tbl: 'active_clients'
  };
  const dataEntriesA = [
    { passkey: '1', peer_id: 'a', info_hash: 'A' },
    { passkey: '2', peer_id: 'a', info_hash: 'A' },
    { passkey: '2', peer_id: 'b', info_hash: 'A' },
    { passkey: '2', peer_id: 'b', info_hash: 'B' },
    { passkey: '3', peer_id: 'b', info_hash: 'B' },
    { passkey: '3', peer_id: 'c', info_hash: 'B' },
    { passkey: '3', peer_id: 'c', info_hash: 'C' }
  ];
  const dataEntriesR = [
    { passkey: '3', peer_id: 'c', info_hash: 'C'},
    { passkey: '1'},
    { peer_id: 'b', info_hash: 'B'},
    undefined
  ];

  /** @type {import('../utils/common/database').ActiveClientsConn} */
  const conn = database.ActiveClientsConn(clientParams);

  log(INFO, 'Trying to connect to the database');
  log(INFO, 'Client parameter:');
  log(clientParams);

  await conn.connect()
    .then(v => {
      log(INFO, 'Results:');
      log(v);
    })
    .catch(r => {
      log(ERROR, 'Reason:');
      log(r);
      return 1;
    });

  log(INFO, 'Trying to initialize the database');
  await conn.initialize()
    .then(v => {
      log(INFO, 'Results:');
      log(v);
    })
    .catch(r => {
      log(ERROR, 'Reason:');
      log(r);
      return 1;
    });

  log(INFO, 'Trying to add data');
  log(INFO, 'Data to be added:');
  log(dataEntriesA);

  for (let i = 0; i < dataEntriesA.length; ++i) {
    log(INFO, `Data piece ${i+1} / ${dataEntriesA.length}:`, dataEntriesA[i]);
    await conn.addClient(dataEntriesA[i])
      .then(v => {
        log(INFO, 'Results:');
        log(v);
      })
      .catch(r => {
        log(ERROR, 'Reason:');
        log(r);
        return 1;
      });
    log(INFO, 'Trying to query all data');
    await conn.queryClients()
      .then(v => {
        log(INFO, 'Results:');
        log(v);
      })
      .catch(r => {
        log(ERROR, 'Reason:');
        log(r);
        return 1;
      });
  }

  log(INFO, 'Trying to remove data');
  log(INFO, 'Data to be removed:');
  log(dataEntriesR);

  for (let i = 0; i < dataEntriesR.length; ++i) {
    log(INFO, `Data piece ${i+1} / ${dataEntriesR.length}:`, dataEntriesR[i]);
    await conn.removeClients(dataEntriesR[i])
      .then(v => {
        log(INFO, 'Results:');
        log(v);
      })
      .catch(r => {
        log(ERROR, 'Reason:');
        log(r);
        return 1;
      });
    log(INFO, 'Trying to query all data');
    await conn.queryClients()
      .then(v => {
        log(INFO, 'Results:');
        log(v);
      })
      .catch(r => {
        log(ERROR, 'Reason:');
        log(r);
        return 1;
      });
  }

  log(INFO, '=== Active Clients database END ===');

  return 0;
})();