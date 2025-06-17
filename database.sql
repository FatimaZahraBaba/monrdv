-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 07, 2025 at 08:11 PM
-- Server version: 9.0.1
-- PHP Version: 8.3.15

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `erraji-semelle`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int NOT NULL,
  `patient_id` int NOT NULL,
  `doctor_id` int DEFAULT NULL,
  `service_id` int DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `positif_molding` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','passed','cancelled','instance','delivered') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `service_id`, `date`, `price`, `positif_molding`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, NULL, '2025-02-10 09:00:00', 200.00, 0, 'active', '2025-01-31 02:05:37', '2025-02-07 14:57:00'),
(2, 2, 1, NULL, '2025-02-11 11:30:00', 300.00, 0, 'passed', '2025-01-31 02:05:37', '2025-02-16 18:12:59'),
(3, 3, NULL, NULL, '2025-02-12 15:00:00', 100.00, 0, 'cancelled', '2025-01-31 02:05:37', '2025-02-07 14:57:00'),
(4, 4, NULL, NULL, '2025-02-13 08:00:00', 200.00, 0, 'passed', '2025-01-31 02:05:37', '2025-02-07 14:57:00'),
(5, 5, 2, NULL, '2025-02-14 17:30:00', 300.00, 0, 'active', '2025-01-31 02:05:37', '2025-02-18 21:25:32'),
(6, 6, 2, NULL, '2025-02-15 14:00:00', 100.00, 0, 'active', '2025-01-31 02:05:37', '2025-02-16 18:42:19'),
(7, 7, NULL, NULL, '2025-02-16 10:00:00', 200.00, 0, 'passed', '2025-01-31 02:05:37', '2025-02-07 14:57:00'),
(8, 8, NULL, NULL, '2025-02-17 13:30:00', 300.00, 0, 'cancelled', '2025-01-31 02:05:37', '2025-02-07 14:57:00'),
(9, 9, 1, 2, '2025-02-18 16:30:00', 100.00, 0, 'passed', '2025-01-31 02:05:37', '2025-03-12 01:13:03'),
(10, 10, 1, 1, '2025-02-19 12:00:00', 200.00, 0, 'passed', '2025-01-31 02:05:37', '2025-03-12 01:12:22'),
(14, 15, 1, NULL, '2025-02-14 18:30:00', 300.00, 0, 'active', '2025-02-07 18:32:40', '2025-02-07 18:32:40'),
(15, 18, 2, NULL, '2025-02-19 13:00:00', 300.00, 0, 'cancelled', '2025-02-10 22:58:52', '2025-03-04 20:31:39'),
(17, 12, 2, 3, '2025-03-06 12:00:00', 300.00, 1, 'active', '2025-02-18 20:38:26', '2025-03-25 22:34:23'),
(18, 10, 2, NULL, '2025-02-14 19:00:00', 200.00, 0, 'active', '2025-02-28 21:21:10', '2025-02-28 21:21:10'),
(19, 18, 2, NULL, NULL, 100.00, 0, 'instance', '2025-03-01 12:27:25', '2025-03-26 00:49:34'),
(21, 18, 2, NULL, NULL, 0.00, 0, 'instance', '2025-03-04 21:29:41', '2025-03-26 00:49:34'),
(22, 18, 2, 1, '2025-03-06 12:00:00', 300.00, 0, 'cancelled', '2025-03-13 01:30:43', '2025-03-26 21:38:54'),
(23, 13, 2, 1, NULL, 300.00, 0, 'instance', '2025-03-16 01:25:16', '2025-03-26 00:49:34'),
(24, 11, 2, 1, '2025-03-13 12:30:00', 300.00, 1, 'delivered', '2025-03-16 01:28:12', '2025-03-26 04:45:19'),
(25, 20, 2, 1, '2025-03-21 13:30:00', 0.00, 0, 'cancelled', '2025-03-21 01:22:18', '2025-03-26 21:38:32'),
(27, 20, 2, 1, NULL, 300.00, 0, 'instance', '2025-03-21 05:25:36', '2025-03-25 23:31:21'),
(28, 19, 2, 2, NULL, 0.00, 0, 'instance', '2025-03-21 05:29:06', '2025-03-26 00:49:34'),
(29, 19, 2, 1, '2025-03-29 12:30:00', 300.00, 0, 'passed', '2025-03-26 22:41:06', '2025-04-02 03:44:27'),
(30, 19, 2, 1, NULL, 300.00, 1, 'instance', '2025-04-02 02:33:15', '2025-04-03 00:13:14'),
(31, 21, 2, 1, '2025-04-05 10:30:00', 300.00, 0, 'active', '2025-04-02 16:38:58', '2025-04-03 00:12:21');

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `name`) VALUES
(1, 'Mohamed Amzil'),
(2, 'Karima El Marini');

-- --------------------------------------------------------

--
-- Table structure for table `mutuals`
--

CREATE TABLE `mutuals` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `mutuals`
--

INSERT INTO `mutuals` (`id`, `name`) VALUES
(2, 'CNOPS'),
(1, 'CNSS');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int NOT NULL,
  `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `phone2` varchar(20) DEFAULT NULL,
  `cin` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `mutual_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `first_name`, `last_name`, `phone`, `phone2`, `cin`, `address`, `note`, `mutual_id`, `created_at`, `updated_at`) VALUES
(1, 'Ahmed', 'Ahmed ', '0623456789', NULL, 'J123456', 'Rue Moulay Ismail, Rabat', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(2, 'Fatima', 'Fatima ', '0678945123', NULL, 'K789012', 'Boulevard Hassan II, Casablanca', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(3, 'Mohamed', 'Mohamed ', '0632148756', NULL, 'L345678', 'Avenue Mohammed V, Marrakech', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(4, 'Khadija', 'Khadija ', '0612547896', NULL, 'M901234', 'Route de Fès, Meknès', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(5, 'Omar', 'Omar ', '0687456321', NULL, 'N567890', 'Hay Salam, Agadir', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(6, 'Salma', 'Salma ', '0645987231', NULL, 'P123456', 'Avenue Al Qods, Fès', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(7, 'Ali', 'Ali ', '0654789123', NULL, 'Q789012', 'Quartier Bourgogne, Casablanca', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(8, 'Latifa', 'Latifa ', '0601258749', NULL, 'R345678', 'Boulevard Al Massira, Tétouan', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(9, 'Youssef', 'Youssef ', '0678954123', NULL, 'S901234', 'Avenue Hassan I, Oujda', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(10, 'Imane', 'Imane ', '0698741235', NULL, 'T567890', 'Hay Al Mansour, Kenitra', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(11, 'Hassan', 'Hassan ', '0635897412', NULL, 'U123456', 'Route de Casablanca, El Jadida', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(12, 'Nadia', 'Nadia ', '0624789531', NULL, 'V789012', 'Avenue Taddart, Témara', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(13, 'Zakaria', 'Zakaria ', '0662145879', NULL, 'W345678', 'Hay Nahda, Salé', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(14, 'Sofia', 'Sofia ', '0612547896', NULL, 'X901234', 'Hay Mohammadi, Tanger', NULL, NULL, '2025-01-31 02:04:13', '2025-03-02 20:45:49'),
(15, 'Anas', 'ANAS ', '0678951234', NULL, 'Y567890', 'Avenue Prince Moulay Abdallah, Nador', NULL, NULL, '2025-01-31 02:04:13', '2025-03-16 02:18:40'),
(18, 'Said', 'SAID', '066665425', NULL, NULL, NULL, 'A popup that displays information related to an element when the element receives keyboard', 2, '2025-02-10 22:52:55', '2025-03-02 21:20:55'),
(19, 'Karim', 'ADAMI', '09766634', '', NULL, NULL, NULL, 2, '2025-03-16 02:19:28', '2025-03-26 22:41:06'),
(20, 'Test', 'TEST', '98 88 88 8', '', NULL, NULL, NULL, 1, '2025-03-16 02:21:29', '2025-04-07 02:19:43'),
(21, 'Karimi', 'KARIMA', '21 02 91 92 12', '', NULL, NULL, NULL, 2, '2025-04-02 16:38:35', '2025-04-07 02:19:37');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `appointment_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `appointment_id`, `amount`, `created_at`) VALUES
(24, 24, 100.00, '2025-03-24 04:28:36'),
(25, 24, 150.00, '2025-03-26 04:32:56'),
(26, 24, 50.00, '2025-03-26 04:45:13'),
(35, 22, 100.00, '2025-03-24 22:53:24'),
(36, 22, 100.00, '2025-03-24 02:12:01'),
(42, 29, 100.00, '2025-03-26 22:41:06');

-- --------------------------------------------------------

--
-- Table structure for table `prices`
--

CREATE TABLE `prices` (
  `id` int NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `prices`
--

INSERT INTO `prices` (`id`, `price`) VALUES
(1, 100.00),
(2, 200.00),
(3, 300.00),
(4, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `billable` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `billable`) VALUES
(1, 'SEMELLE ORTHOPEDIQUE', 1),
(2, 'ORTHESE', 1),
(3, 'RECTIFICATION', 0),
(4, 'AUTRES', 0);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `address_header` text NOT NULL,
  `address_footer` text NOT NULL,
  `patente` varchar(100) NOT NULL,
  `rc` varchar(100) NOT NULL,
  `cnss` varchar(100) NOT NULL,
  `ice` varchar(100) NOT NULL,
  `if` varchar(100) NOT NULL,
  `nb_facture` int NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`email`, `phone`, `address_header`, `address_footer`, `patente`, `rc`, `cnss`, `ice`, `if`, `nb_facture`, `updated_at`) VALUES
('orthopedeagadir@gmail.com', '05 28 23 62 73', 'Avenue Abou Jihad, N° 12 cité El Massira\r\n80000 AGADIR', 'Pharmacie Erraji : Av. Abou Jihad, cité Al Massira - AGADIR', '48136207', '33038', '6023303', '00117590000061', '75758990', 0, '2025-02-21 20:39:51');

-- --------------------------------------------------------

--
-- Table structure for table `status`
--

CREATE TABLE `status` (
  `id` int NOT NULL,
  `appointment_id` int NOT NULL,
  `status` enum('active','passed','cancelled','instance','delivered') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `status`
--

INSERT INTO `status` (`id`, `appointment_id`, `status`, `created_at`) VALUES
(2, 27, 'instance', '2025-03-21 05:25:36'),
(3, 28, 'active', '2025-03-21 05:29:06'),
(5, 17, 'cancelled', '2025-03-25 22:34:23'),
(6, 22, 'passed', '2025-03-25 22:53:30'),
(7, 25, 'active', '2025-03-26 02:06:01'),
(10, 24, 'passed', '2025-03-26 03:48:30'),
(11, 24, 'delivered', '2025-03-26 04:45:19'),
(12, 25, 'cancelled', '2025-03-26 21:38:32'),
(13, 22, 'cancelled', '2025-03-26 21:38:54'),
(14, 29, 'active', '2025-03-26 22:41:06'),
(15, 29, 'passed', '2025-04-02 02:21:17'),
(16, 30, 'instance', '2025-04-02 02:33:15'),
(17, 31, 'instance', '2025-04-02 16:38:58'),
(20, 31, 'active', '2025-04-03 00:11:27');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `roles` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `is_admin`, `active`, `roles`, `created_at`) VALUES
(1, 'admin', '$2a$10$1rishHYmnywbMHyF4YcaPu40ThFBXUjI1X4kLuED5VVrnsCaDseyK', 1, 1, '{\"users\": true, \"prices\": true, \"doctors\": true, \"patients\": true, \"payments\": false, \"users_edit\": true, \"users_list\": true, \"prices_edit\": true, \"prices_list\": true, \"appointments\": true, \"doctors_edit\": true, \"doctors_list\": true, \"users_create\": true, \"users_delete\": true, \"patients_edit\": true, \"patients_list\": true, \"prices_create\": true, \"prices_delete\": true, \"doctors_create\": true, \"doctors_delete\": true, \"patients_create\": true, \"patients_delete\": true, \"appointments_edit\": true, \"appointments_list\": true, \"appointments_create\": true, \"appointments_delete\": true}', '2025-02-19 18:05:30'),
(3, 'fatimazahra', '$2b$10$Sto9w.u65okjaQBsmADWQe7UZRFxHMs1441vN4ZVswcM4pHXS9wsq', 0, 1, '{\"payments\": false, \"settings\": true, \"users_edit\": true, \"users_list\": true, \"prices_edit\": true, \"prices_list\": true, \"doctors_edit\": true, \"doctors_list\": true, \"mutuals_edit\": true, \"mutuals_list\": true, \"users_create\": true, \"users_delete\": true, \"patients_edit\": true, \"patients_list\": true, \"prices_create\": true, \"prices_delete\": true, \"doctors_create\": true, \"doctors_delete\": true, \"mutuals_create\": true, \"mutuals_delete\": true, \"payments_print\": false, \"patients_create\": true, \"patients_delete\": true, \"appointments_edit\": true, \"appointments_list\": true, \"appointments_create\": true, \"appointments_delete\": true}', '2025-02-22 17:27:05'),
(5, 'test', '$2b$10$uhNoKZjPwCVygxK/m0DXxeEBNY8TDSl5W3f5eAznzEP2WAr7H23Ju', 0, 1, '{\"users\": false, \"prices\": true, \"doctors\": true, \"mutuals\": true, \"patients\": true, \"services\": true, \"users_edit\": true, \"users_list\": false, \"prices_edit\": true, \"prices_list\": true, \"appointments\": true, \"doctors_edit\": true, \"doctors_list\": true, \"mutuals_edit\": true, \"mutuals_list\": true, \"users_create\": true, \"users_delete\": true, \"patients_edit\": true, \"patients_list\": true, \"prices_create\": true, \"prices_delete\": true, \"services_edit\": true, \"services_list\": true, \"doctors_create\": true, \"doctors_delete\": true, \"mutuals_create\": true, \"mutuals_delete\": true, \"payments_print\": true, \"patients_create\": true, \"patients_delete\": true, \"services_create\": true, \"services_delete\": true, \"appointments_edit\": true, \"appointments_list\": true, \"appointments_create\": true, \"appointments_delete\": true}', '2025-03-11 23:03:13'),
(6, 'user', '$2b$10$BTiTGR3oDx78UQCLOH4eqO/Q/GCEL.WrheTktQIEJP67BR/X0rML2', 0, 1, '{\"prices\": true, \"doctors\": true, \"mutuals\": true, \"patients\": true, \"payments\": true, \"services\": true, \"prices_edit\": true, \"prices_list\": true, \"appointments\": true, \"doctors_edit\": true, \"doctors_list\": true, \"mutuals_edit\": true, \"mutuals_list\": true, \"patients_edit\": true, \"patients_list\": true, \"prices_create\": true, \"prices_delete\": true, \"services_edit\": true, \"services_list\": true, \"doctors_create\": true, \"doctors_delete\": true, \"mutuals_create\": true, \"mutuals_delete\": true, \"patients_create\": true, \"patients_delete\": true, \"services_create\": true, \"services_delete\": true, \"appointments_edit\": true, \"appointments_list\": true, \"appointments_create\": true, \"appointments_delete\": true}', '2025-03-13 00:53:29');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mutuals`
--
ALTER TABLE `mutuals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `prices`
--
ALTER TABLE `prices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `status`
--
ALTER TABLE `status`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `mutuals`
--
ALTER TABLE `mutuals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `prices`
--
ALTER TABLE `prices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `status`
--
ALTER TABLE `status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
