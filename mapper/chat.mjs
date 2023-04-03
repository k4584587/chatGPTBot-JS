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

export async function insertLog(param) {
    await executeQuery('insertLog', param);
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

export async function insertConversationHistory(param) {
    await executeQuery('insertConversationHistory', param);
}

export async function insertParentHistory(param) {
    await executeQuery('insertParentHistory', param);
}


export async function selectConversationHistory(param) {
    return await executeQuery('selectConversationHistory', param);
}

export async function updateConversationHistoryFlg(param) {
    return await executeQuery('updateConversationHistoryFlg', param);
}


export async function autoConversationHistoryFlg(param) {
    return await executeQuery('autoConversationHistoryFlg', param);
}

export async function autoParentHistoryFlg(param) {
    return await executeQuery('autoParentHistoryFlg', param);
}

export async function updateParentHistory(param) {
    return await executeQuery('updateParentHistory', param);
}

export async function selectParentHistory(param) {
    return await executeQuery('selectParentHistory', param);
}
