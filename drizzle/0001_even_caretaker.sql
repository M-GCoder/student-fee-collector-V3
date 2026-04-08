CREATE TABLE `payments` (
	`id` varchar(64) NOT NULL,
	`studentId` varchar(64) NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`paidDate` varchar(50) NOT NULL,
	`amount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`class` varchar(50) NOT NULL,
	`monthlyFee` int NOT NULL,
	`monthlyDueDate` int,
	`dueDate` varchar(50),
	`email` varchar(320),
	`password` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
