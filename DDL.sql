CREATE TABLE IF NOT EXISTS `nb_chat_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `CHAT_MSG` text DEFAULT NULL COMMENT '채팅 메시지',
  `RESULT_MSG` text DEFAULT NULL,
  `CREATE_DATE` timestamp NULL DEFAULT NULL COMMENT '생성 시간',
  `DISCORD_ID` varchar(50) DEFAULT NULL,
  `DISCORD_NAME` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nb_history` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `DISCORD_ID` varchar(255) NOT NULL DEFAULT '0' COMMENT '디스코드 사용자 아이디',
  `CONVERSATION_ID` varchar(255) DEFAULT NULL,
  `PARENT_MESSAGE_ID` varchar(255) DEFAULT NULL,
  `CREATE_DATE` timestamp NULL DEFAULT NULL COMMENT '생성 시간',
  `DELETE_FLG` char(1) DEFAULT 'N' COMMENT '세션 삭제 플래그',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nb_queue` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `discord_id` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `conversation_id` varchar(50) DEFAULT NULL,
  `parent_message_id` varchar(50) DEFAULT NULL,
  `complete_flg` char(1) NOT NULL DEFAULT 'N',
  `create_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
