CREATE TABLE `employee_credentials` (
		`id` int AUTO_INCREMENT NOT NULL,
		`userId` int NOT NULL,
		`username` varchar(120) NOT NULL,
		`passwordHash` varchar(500) NOT NULL,
		`status` enum('active','disabled') NOT NULL DEFAULT 'active',
		`failedAttempts` int NOT NULL DEFAULT 0,
		`lockedUntil` timestamp,
		`lastLoginAt` timestamp,
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `employee_credentials_id` PRIMARY KEY(`id`),
		CONSTRAINT `employee_credentials_userId_unique` UNIQUE(`userId`),
		CONSTRAINT `employee_credentials_username_unique` UNIQUE(`username`),
		CONSTRAINT `employee_credentials_user_unique` UNIQUE(`userId`)
);
