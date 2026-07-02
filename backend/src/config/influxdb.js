const { InfluxDB } = require('@influxdata/influxdb-client');
const env = require('./env');

let influxClient = null;
let writeApi = null;
let queryApi = null;

/**
 * Initialize InfluxDB client
 */
function initInfluxDB() {
  influxClient = new InfluxDB({
    url: env.influx.url,
    token: env.influx.token,
  });

  writeApi = influxClient.getWriteApi(env.influx.org, env.influx.bucket, 's');
  writeApi.useDefaultTags({ platform: 'bmc-iot' });

  queryApi = influxClient.getQueryApi(env.influx.org);

  return { influxClient, writeApi, queryApi };
}

function getWriteApi() {
  if (!writeApi) initInfluxDB();
  return writeApi;
}

function getQueryApi() {
  if (!queryApi) initInfluxDB();
  return queryApi;
}

async function closeInfluxDB() {
  if (writeApi) {
    await writeApi.close();
  }
}

module.exports = {
  initInfluxDB,
  getWriteApi,
  getQueryApi,
  closeInfluxDB,
};
