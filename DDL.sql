CREATE TABLE IF NOT EXISTS `nb_chat_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `CHAT_MSG` text DEFAULT NULL COMMENT '채팅 메시지',
  `RESULT_MSG` text DEFAULT NULL,
  `CREATE_DATE` timestamp NULL DEFAULT NULL COMMENT '생성 시간',
  `DISCORD_ID` varchar(50) DEFAULT NULL,
  `DISCORD_NAME` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
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


# 2023.04.03 테이블 추가
CREATE TABLE `nb_conversation_history` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`CONVERSATION_ID` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	`DISCORD_ID` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	`CREATE_DATE` DATETIME NULL DEFAULT NULL,
	`DEL_FLG` CHAR(1) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	PRIMARY KEY (`id`) USING BTREE
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;
CREATE TABLE `nb_parent_history` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`PARENT_MESSAGE_ID` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	`DISCORD_ID` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	`CREATE_DATE` DATETIME NULL DEFAULT NULL,
	`DEL_FLG` CHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	PRIMARY KEY (`id`) USING BTREE
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

