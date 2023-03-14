import mybatisMapper from 'mybatis-mapper';
import pool from "../config/db.mjs";
import log4js from '../config/log4js.mjs';

const logger = log4js.getLogger();

// create the myBatisMapper from xml file and assign it to a variable
mybatisMapper.createMapper(['./query/chat.xml']);

async function executeQuery(statement, param) {
  const query = mybatisMapper.getStatement('ChatGPT', statement, param);
  try {
    const [results, fields] = await pool.query(query);
    //logger.info(results);
    return results;
  } catch (err) {
    logger.error(err);
    throw new Error('Error executing query');
  }
}

export async function selectHistory(param) {
    return await executeQuery('selectHistory', param);
}

export async function updateHistoryFlg(param) {
    return await executeQuery('updateHistoryFlg', param);
}

export async function insertLog(param) {
    await executeQuery('insertLog', param);
}

export async function insertHistory(param) {
    await executeQuery('insertHistory', param);
}
export async function selectQueue() {
    return await executeQuery('selectQueue');
}
export async function insertQueue(param) {
    await executeQuery('insertQueue', param);
}

export async function updateQueue(param) {
    await executeQuery('updateQueue', param);
}

