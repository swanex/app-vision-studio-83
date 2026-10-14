import { useState, useMemo, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Plus,
  Heart,
  Activity,
  SlidersHorizontal,
  X,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Search
} from 'lucide-react';

// User's actual parsed dataset from [11.01.2026 1158] Roma Lebedev давл.txt
const ROMA_INITIAL_RECORDS = [
  { id: 'r-1', date: '2026-01-11', time: '11:58', sys: 127, dia: 79, pulse: 65, note: 'После пробуждения и разминок' },
  { id: 'r-2', date: '2026-01-12', time: '12:27', sys: 117, dia: 78, pulse: null, note: 'Утром после завтрака' },
  { id: 'r-3', date: '2026-01-21', time: '22:06', sys: 135, dia: 87, pulse: null, note: 'Вечером, повышенная тревожность (серия: 144/92 -> 134/89 -> 135/87)' },
  { id: 'r-4', date: '2026-01-22', time: '15:05', sys: 122, dia: 85, pulse: 60, note: 'В спокойствии (серия: 128/89 -> 127/86 -> 122/85)' },
  { id: 'r-5', date: '2026-01-26', time: '16:36', sys: 121, dia: 83, pulse: 66, note: 'После трени, обеда, кофе' },
  { id: 'r-6', date: '2026-02-09', time: '20:40', sys: 130, dia: 90, pulse: 75, note: 'Тревожность есть (серия: 130/89 -> 130/90)' },
  { id: 'r-7a', date: '2026-02-10', time: '06:56', sys: 124, dia: 90, pulse: null, note: 'После пробуждения' },
  { id: 'r-7b', date: '2026-02-10', time: '21:00', sys: 124, dia: 91, pulse: 68, note: 'Вечером' },
  { id: 'r-8', date: '2026-02-11', time: '19:30', sys: 127, dia: 87, pulse: 75, note: 'Вечер после прогулки (до прогулки 130/88). Днем было кардио!' },
  { id: 'r-9a', date: '2026-02-12', time: '10:26', sys: 125, dia: 87, pulse: 67, note: 'Утро (до кофе)' },
  { id: 'r-9b', date: '2026-02-12', time: '12:30', sys: 128, dia: 82, pulse: 63, note: 'Полдень' },
  { id: 'r-10a', date: '2026-02-13', time: '13:00', sys: 126, dia: 86, pulse: 60, note: 'День' },
  { id: 'r-10b', date: '2026-02-13', time: '21:00', sys: 120, dia: 85, pulse: null, note: 'Вечер' },
  { id: 'r-11', date: '2026-02-14', time: '10:38', sys: 123, dia: 86, pulse: null, note: 'Утро' },
  { id: 'r-12', date: '2026-02-14', time: '21:57', sys: 126, dia: 84, pulse: null, note: 'Вечер, без прогулки!' },
  { id: 'r-13', date: '2026-02-15', time: '10:19', sys: 118, dia: 81, pulse: null, note: 'Утром после завтрака, выспавшись!' },
  { id: 'r-14', date: '2026-02-15', time: '21:30', sys: 117, dia: 82, pulse: 72, note: 'Вечером после прогулки' },
  { id: 'r-15', date: '2026-02-16', time: '21:41', sys: 123, dia: 86, pulse: 66, note: 'Вечером в день силовой' },
  { id: 'r-16a', date: '2026-02-17', time: '09:33', sys: 123, dia: 82, pulse: null, note: 'Утром' },
  { id: 'r-16b', date: '2026-02-17', time: '21:00', sys: 121, dia: 88, pulse: null, note: 'Вечером' },
  { id: 'r-17', date: '2026-02-18', time: '11:34', sys: 108, dia: 72, pulse: null, note: 'Утром аномально низкое!' },
  { id: 'r-18', date: '2026-02-18', time: '21:00', sys: 119, dia: 81, pulse: 72, note: 'Вечером после прогулки' },
  { id: 'r-19', date: '2026-02-22', time: '09:30', sys: 117, dia: 78, pulse: null, note: 'Утром после зарядки' },
  { id: 'r-20a', date: '2026-02-23', time: '08:54', sys: 117, dia: 76, pulse: null, note: 'Утро во время завтрака' },
  { id: 'r-20b', date: '2026-02-23', time: '21:00', sys: 110, dia: 76, pulse: null, note: 'Вечером после дня ног' },
  { id: 'r-21', date: '2026-02-24', time: '22:29', sys: 113, dia: 80, pulse: 68, note: 'Вечером после прогулки (легкое ощущение тревожности)' },
  { id: 'r-22', date: '2026-02-25', time: '07:35', sys: 115, dia: 78, pulse: null, note: 'Утро' },
  { id: 'r-23', date: '2026-03-08', time: '22:38', sys: 117, dia: 78, pulse: null, note: 'Стабильно, и утром и вечером после прогулки' },
  { id: 'r-24', date: '2026-03-09', time: '21:21', sys: 112, dia: 77, pulse: 65, note: 'После дня трени, вечером' },
  { id: 'r-25', date: '2026-03-10', time: '09:16', sys: 111, dia: 75, pulse: 65, note: 'Утро' },
  { id: 'r-26', date: '2026-03-16', time: '23:23', sys: 114, dia: 78, pulse: 65, note: 'Поздний вечер после трени' },
  { id: 'r-27', date: '2026-03-18', time: '08:00', sys: 128, dia: 83, pulse: null, note: 'Утром' },
  { id: 'r-28', date: '2026-03-18', time: '19:51', sys: 118, dia: 83, pulse: null, note: 'Вечер' },
  { id: 'r-29', date: '2026-03-19', time: '08:38', sys: 126, dia: 75, pulse: null, note: 'Утро' },
  { id: 'r-30a', date: '2026-03-20', time: '08:50', sys: 119, dia: 84, pulse: 73, note: 'Утро' },
  { id: 'r-30b', date: '2026-03-20', time: '15:00', sys: 122, dia: 84, pulse: 70, note: 'После трени' },
  { id: 'r-31', date: '2026-03-21', time: '10:24', sys: 117, dia: 82, pulse: 62, note: 'Утро' },
  { id: 'r-32', date: '2026-03-22', time: '09:33', sys: 125, dia: 83, pulse: 71, note: 'Утро' },
  { id: 'r-33', date: '2026-03-23', time: '08:07', sys: 130, dia: 80, pulse: 75, note: 'Утро' },
  { id: 'r-34', date: '2026-03-23', time: '20:57', sys: 123, dia: 84, pulse: 66, note: 'Вечер' },
  { id: 'r-35', date: '2026-03-24', time: '07:43', sys: 123, dia: 76, pulse: 71, note: 'Утро' },
  { id: 'r-36', date: '2026-03-27', time: '08:12', sys: 120, dia: 85, pulse: 75, note: 'Утро' },
  { id: 'r-37', date: '2026-03-27', time: '23:07', sys: 127, dia: 89, pulse: 63, note: 'Вечер, день трени, сильно' },
  { id: 'r-38', date: '2026-03-28', time: '09:51', sys: 126, dia: 86, pulse: 75, note: 'Утром' },
  { id: 'r-39', date: '2026-03-30', time: '08:49', sys: 127, dia: 79, pulse: 75, note: 'Утро' },
  { id: 'r-40', date: '2026-04-03', time: '07:59', sys: 123, dia: 82, pulse: 75, note: 'Утро' },
  { id: 'r-41', date: '2026-04-04', time: '09:41', sys: 120, dia: 76, pulse: 65, note: 'Утро' },
  { id: 'r-42', date: '2026-04-09', time: '08:23', sys: 112, dia: 73, pulse: 68, note: 'Утро' },
  { id: 'r-43', date: '2026-04-13', time: '08:42', sys: 114, dia: 72, pulse: null, note: 'Утро' },
  { id: 'r-44', date: '2026-04-17', time: '07:50', sys: 126, dia: 79, pulse: 70, note: 'Утро' },
  { id: 'r-45', date: '2026-04-18', time: '07:59', sys: 127, dia: 75, pulse: 66, note: 'Утро' },
  { id: 'r-46', date: '2026-04-19', time: '09:18', sys: 124, dia: 79, pulse: 66, note: 'Утро' },
  { id: 'r-47a', date: '2026-04-20', time: '09:00', sys: 119, dia: 76, pulse: 70, note: 'Утром' },
  { id: 'r-47b', date: '2026-04-20', time: '13:27', sys: 116, dia: 76, pulse: 72, note: 'После трени' },
  { id: 'r-48', date: '2026-04-21', time: '08:10', sys: 123, dia: 83, pulse: 69, note: 'Утро' },
  { id: 'r-49', date: '2026-04-24', time: '08:08', sys: 114, dia: 77, pulse: 69, note: 'Утро' },
  { id: 'r-50', date: '2026-04-25', time: '08:30', sys: 114, dia: 75, pulse: 68, note: 'Утро' },
  { id: 'r-51', date: '2026-04-26', time: '10:49', sys: 123, dia: 70, pulse: 65, note: 'Утро' },
  { id: 'r-52', date: '2026-04-27', time: '09:00', sys: 118, dia: 78, pulse: 62, note: 'Утро' },
  { id: 'r-53', date: '2026-04-29', time: '08:08', sys: 114, dia: 77, pulse: 66, note: 'Утро' },
  { id: 'r-54', date: '2026-04-30', time: '10:30', sys: 113, dia: 73, pulse: 66, note: 'Утро' },
  { id: 'r-55', date: '2026-05-01', time: '09:21', sys: 121, dia: 81, pulse: 66, note: 'Утро' },
  { id: 'r-56', date: '2026-05-06', time: '08:36', sys: 126, dia: 82, pulse: null, note: 'Утро' },
  { id: 'r-57', date: '2026-05-07', time: '08:11', sys: 118, dia: 84, pulse: 70, note: 'Серия утром: 130/80 -> 123/85 -> 121/84 -> 118/84' },
  { id: 'r-58', date: '2026-05-09', time: '19:25', sys: 129, dia: 89, pulse: 77, note: 'Вечером после прогулки (до прогулки 130/85)' },
  { id: 'r-59', date: '2026-05-10', time: '08:16', sys: 126, dia: 82, pulse: 70, note: 'Утро' },
  { id: 'r-60', date: '2026-05-11', time: '09:36', sys: 111, dia: 82, pulse: 64, note: 'Утро' },
  { id: 'r-61', date: '2026-05-12', time: '08:51', sys: 115, dia: 83, pulse: 69, note: 'Утро' },
  { id: 'r-62', date: '2026-05-13', time: '07:22', sys: 126, dia: 84, pulse: 69, note: 'Утро' },
  { id: 'r-63', date: '2026-05-15', time: '08:31', sys: 118, dia: 79, pulse: 74, note: 'Утро (первый замер 125/82 75 -> 118/79 74)' },
  { id: 'r-64', date: '2026-05-16', time: '08:28', sys: 125, dia: 75, pulse: 63, note: 'Утро' },
  { id: 'r-65', date: '2026-05-19', time: '08:41', sys: 116, dia: 84, pulse: 62, note: 'Утро' },
  { id: 'r-66', date: '2026-05-20', time: '08:08', sys: 116, dia: 86, pulse: null, note: 'Серия: 120/86 -> 119/87 -> 111/88 -> 116/86' },
  { id: 'r-67', date: '2026-05-21', time: '07:59', sys: 114, dia: 78, pulse: 64, note: 'Утро (122/80 64 -> 114/78)' },
  { id: 'r-68', date: '2026-05-26', time: '09:37', sys: 118, dia: 84, pulse: 63, note: 'Утро (124/83 63 -> 118/84)' },
  { id: 'r-69', date: '2026-05-29', time: '08:34', sys: 116, dia: 84, pulse: 59, note: 'Утро' },
  { id: 'r-70', date: '2026-05-30', time: '08:53', sys: 112, dia: 82, pulse: 58, note: 'Утро' },
  { id: 'r-71a', date: '2026-06-05', time: '08:47', sys: 119, dia: 81, pulse: 62, note: 'Утро (серия: 119/86 -> 120/83 -> 119/81)' },
  { id: 'r-71b', date: '2026-06-05', time: '11:00', sys: 118, dia: 84, pulse: 64, note: 'После кардио' },
  { id: 'r-72', date: '2026-06-07', time: '11:30', sys: 120, dia: 84, pulse: 63, note: 'Утро' },
  { id: 'r-73', date: '2026-06-12', time: '09:33', sys: 124, dia: 82, pulse: 71, note: 'Утро' },
  { id: 'r-74', date: '2026-06-14', time: '12:43', sys: 119, dia: 83, pulse: null, note: 'День' },
  { id: 'r-75', date: '2026-06-15', time: '08:51', sys: 126, dia: 82, pulse: 60, note: 'Утро' },
  { id: 'r-76', date: '2026-06-17', time: '09:28', sys: 113, dia: 75, pulse: 68, note: 'Утро' },
  { id: 'r-77', date: '2026-06-18', time: '09:40', sys: 113, dia: 78, pulse: 67, note: 'Утро' },
  { id: 'r-78', date: '2026-06-23', time: '09:40', sys: 115, dia: 82, pulse: 64, note: 'Утро' },
  { id: 'r-79', date: '2026-06-24', time: '08:01', sys: 121, dia: 75, pulse: 66, note: 'Утро' },
  { id: 'r-80', date: '2026-06-25', time: '09:05', sys: 126, dia: 85, pulse: 61, note: 'Утро (первый замер 130/86 -> 126/85)' },
  { id: 'r-81', date: '2026-06-26', time: '08:47', sys: 129, dia: 83, pulse: 75, note: 'Утро' },
  { id: 'r-82', date: '2026-06-28', time: '11:40', sys: 120, dia: 88, pulse: 66, note: 'Утро (123/88 65 -> 120/88 66)' },
  { id: 'r-83', date: '2026-07-01', time: '08:49', sys: 115, dia: 84, pulse: 66, note: 'Утро' },
  { id: 'r-84', date: '2026-07-02', time: '08:51', sys: 116, dia: 80, pulse: 64, note: 'Утро' },
  { id: 'r-85', date: '2026-07-03', time: '08:31', sys: 119, dia: 81, pulse: 72, note: 'Утро' },
  { id: 'r-86', date: '2026-07-11', time: '09:36', sys: 124, dia: 79, pulse: 68, note: 'Утро' },
  { id: 'r-87', date: '2026-07-12', time: '12:48', sys: 120, dia: 84, pulse: 68, note: 'День' },
  { id: 'r-88', date: '2026-07-13', time: '08:30', sys: 127, dia: 86, pulse: 65, note: 'Утро (125/87 -> 127/86)' },
  { id: 'r-89', date: '2026-07-14', time: '11:08', sys: 126, dia: 78, pulse: 66, note: 'Утро' },
  { id: 'r-90', date: '2026-07-15', time: '09:03', sys: 124, dia: 74, pulse: 73, note: 'Утро' },
  { id: 'r-91', date: '2026-07-16', time: '09:40', sys: 127, dia: 79, pulse: 69, note: 'Утро' },
  { id: 'r-92', date: '2026-07-17', time: '14:30', sys: 126, dia: 82, pulse: 82, note: 'Полдень (после кардио и обеда)' },
  { id: 'r-93', date: '2026-07-18', time: '17:36', sys: 119, dia: 79, pulse: 68, note: 'Днем, под вечер' },
  { id: 'r-94', date: '2026-07-19', time: '10:16', sys: 118, dia: 77, pulse: 66, note: 'Утро' },
  { id: 'r-95', date: '2026-07-20', time: '10:00', sys: 117, dia: 80, pulse: 63, note: 'Утро' },
  { id: 'r-96', date: '2026-07-20', time: '23:24', sys: 119, dia: 81, pulse: 65, note: 'Поздний вечер' },
  { id: 'r-97', date: '2026-07-21', time: '08:21', sys: 117, dia: 81, pulse: 62, note: 'Утро' },
  { id: 'r-98', date: '2026-07-22', time: '08:21', sys: 114, dia: 82, pulse: 64, note: 'Утро' },
  { id: 'r-99', date: '2026-07-23', time: '09:20', sys: 125, dia: 83, pulse: 62, note: 'Утро' },
  { id: 'r-100', date: '2026-07-24', time: '08:59', sys: 118, dia: 83, pulse: 62, note: 'Утро' },
  { id: 'r-101', date: '2026-07-24', time: '22:59', sys: 120, dia: 82, pulse: 64, note: 'Вечер' },
  { id: 'r-102', date: '2026-07-26', time: '11:04', sys: 120, dia: 78, pulse: 63, note: 'Утро' },
  { id: 'r-103', date: '2026-07-28', time: '09:16', sys: 119, dia: 77, pulse: 64, note: 'Утро' },
  { id: 'r-104', date: '2026-07-29', time: '09:06', sys: 121, dia: 80, pulse: 70, note: 'Утро' },
  { id: 'r-105', date: '2026-07-30', time: '08:56', sys: 121, dia: 83, pulse: 67, note: 'Утро' },
  { id: 'r-106', date: '2026-07-31', time: '08:53', sys: 121, dia: 84, pulse: 60, note: 'Утро' },
  { id: 'r-107', date: '2026-08-01', time: '08:59', sys: 119, dia: 86, pulse: 63, note: 'Утро' },
  { id: 'r-108', date: '2026-08-03', time: '08:51', sys: 119, dia: 78, pulse: 65, note: 'Утро' },
  { id: 'r-109', date: '2026-08-05', time: '08:18', sys: 124, dia: 79, pulse: 69, note: 'Утро' },
  { id: 'r-110', date: '2026-08-06', time: '11:19', sys: 125, dia: 84, pulse: 65, note: 'Утро' },
  { id: 'r-111', date: '2026-08-07', time: '07:54', sys: 125, dia: 81, pulse: 68, note: 'Утро' },
  { id: 'r-112', date: '2026-08-08', time: '08:29', sys: 119, dia: 81, pulse: 63, note: 'Утро' },
  { id: 'r-113', date: '2026-08-11', time: '10:05', sys: 112, dia: 76, pulse: 64, note: 'Утро' },
  { id: 'r-114', date: '2026-08-12', time: '09:25', sys: 118, dia: 80, pulse: 67, note: 'Утро' },
  { id: 'r-115', date: '2026-08-13', time: '09:27', sys: 120, dia: 83, pulse: 68, note: 'Утро' },
  { id: 'r-116', date: '2026-08-14', time: '08:36', sys: 119, dia: 83, pulse: 59, note: 'Утро' },
  { id: 'r-117', date: '2026-08-15', time: '10:44', sys: 119, dia: 80, pulse: 60, note: 'Утро' },
  { id: 'r-118', date: '2026-08-17', time: '09:05', sys: 116, dia: 75, pulse: 56, note: 'Утро' },
  { id: 'r-119', date: '2026-08-18', time: '09:18', sys: 117, dia: 82, pulse: 63, note: 'Утро' },
  { id: 'r-120', date: '2026-08-19', time: '09:00', sys: 114, dia: 81, pulse: 58, note: 'Утро' },
  { id: 'r-121', date: '2026-08-20', time: '08:39', sys: 120, dia: 83, pulse: 61, note: 'Утро' },
  { id: 'r-122', date: '2026-08-21', time: '08:55', sys: 113, dia: 82, pulse: 67, note: 'Утро' },
  { id: 'r-123', date: '2026-08-22', time: '10:10', sys: 115, dia: 79, pulse: 70, note: 'Утро' },
  { id: 'r-124', date: '2026-08-24', time: '09:06', sys: 120, dia: 79, pulse: 60, note: 'Утро' },
  { id: 'r-125', date: '2026-08-25', time: '09:08', sys: 123, dia: 80, pulse: 65, note: 'Утро' },
  { id: 'r-126', date: '2026-08-26', time: '09:59', sys: 121, dia: 80, pulse: 65, note: 'Утро (123/85 -> 121/80)' },
  { id: 'r-127', date: '2026-08-27', time: '10:10', sys: 123, dia: 78, pulse: 71, note: 'Утро' },
  { id: 'r-128', date: '2026-08-28', time: '09:02', sys: 120, dia: 82, pulse: 72, note: 'Утро' },
  { id: 'r-129', date: '2026-08-29', time: '09:38', sys: 120, dia: 82, pulse: 67, note: 'Утро' },
  { id: 'r-130', date: '2026-08-31', time: '09:11', sys: 124, dia: 78, pulse: 64, note: 'Утро' },
  { id: 'r-131', date: '2026-09-01', time: '08:19', sys: 126, dia: 84, pulse: 68, note: 'Утро' },
  { id: 'r-132', date: '2026-09-03', time: '08:29', sys: 126, dia: 86, pulse: 62, note: 'Утро' },
  { id: 'r-133', date: '2026-09-04', time: '08:38', sys: 124, dia: 81, pulse: 65, note: 'Утро' },
  { id: 'r-134', date: '2026-09-07', time: '07:57', sys: 116, dia: 76, pulse: 58, note: 'Утро' },
  { id: 'r-135', date: '2026-09-07', time: '22:22', sys: 118, dia: 82, pulse: 56, note: 'Вечер' },
  { id: 'r-136', date: '2026-09-08', time: '08:41', sys: 123, dia: 82, pulse: 65, note: 'Утро' },
  { id: 'r-137', date: '2026-09-09', time: '08:44', sys: 124, dia: 82, pulse: 65, note: 'Утро' },
  { id: 'r-138', date: '2026-09-10', time: '08:42', sys: 121, dia: 82, pulse: 68, note: 'Утро, сахар 5.4' },
  { id: 'r-139', date: '2026-09-11', time: '08:46', sys: 123, dia: 84, pulse: 67, note: 'Утро' },
  { id: 'r-140', date: '2026-09-14', time: '08:57', sys: 117, dia: 83, pulse: 58, note: 'Утро' },
  { id: 'r-141', date: '2026-09-15', time: '08:29', sys: 118, dia: 83, pulse: 60, note: 'Утро' },
  { id: 'r-142', date: '2026-09-16', time: '08:34', sys: 122, dia: 82, pulse: 60, note: 'Утро' },
  { id: 'r-143', date: '2026-09-17', time: '09:33', sys: 114, dia: 84, pulse: 70, note: 'Утро' },
  { id: 'r-144', date: '2026-09-18', time: '09:13', sys: 119, dia: 80, pulse: 62, note: 'Утро' },
  { id: 'r-145', date: '2026-09-19', time: '10:25', sys: 118, dia: 81, pulse: 70, note: 'Утро' },
  { id: 'r-146', date: '2026-09-21', time: '08:59', sys: 118, dia: 84, pulse: 63, note: 'Утро' },
  { id: 'r-147', date: '2026-09-22', time: '09:31', sys: 120, dia: 81, pulse: 70, note: 'Утро' },
  { id: 'r-148', date: '2026-09-24', time: '09:01', sys: 115, dia: 78, pulse: 64, note: 'Утро' },
  { id: 'r-149', date: '2026-09-25', time: '09:16', sys: 117, dia: 76, pulse: 70, note: 'Утро' },
  { id: 'r-150', date: '2026-09-26', time: '11:46', sys: 120, dia: 82, pulse: 71, note: 'Утро' },
  { id: 'r-151', date: '2026-09-27', time: '10:18', sys: 114, dia: 81, pulse: 66, note: 'Утро (110/80 63 -> 114/81 66)' },
  { id: 'r-152', date: '2026-09-28', time: '09:20', sys: 118, dia: 81, pulse: 66, note: 'Утро' },
  { id: 'r-153', date: '2026-09-29', time: '09:48', sys: 118, dia: 79, pulse: 68, note: 'Утро' },
  { id: 'r-154', date: '2026-10-01', time: '09:28', sys: 116, dia: 81, pulse: 66, note: 'Утро' },
  { id: 'r-155', date: '2026-10-02', time: '08:29', sys: 114, dia: 81, pulse: 72, note: 'Утро' },
  { id: 'r-156', date: '2026-10-04', time: '12:06', sys: 111, dia: 75, pulse: 61, note: 'До кофе (109/73 63 -> 111/75 61)' },
  { id: 'r-157', date: '2026-10-04', time: '13:03', sys: 131, dia: 85, pulse: 55, note: 'После кофе' },
  { id: 'r-158', date: '2026-10-04', time: '14:15', sys: 134, dia: 85, pulse: 56, note: 'Через час после кофе' },
  { id: 'r-159', date: '2026-10-05', time: '08:36', sys: 127, dia: 82, pulse: 63, note: 'Утро' },
  { id: 'r-160', date: '2026-10-05', time: '14:00', sys: 122, dia: 84, pulse: 72, note: 'После кофе и силовой' },
  { id: 'r-161', date: '2026-10-06', time: '10:01', sys: 124, dia: 82, pulse: 65, note: 'Утро' },
  { id: 'r-162', date: '2026-10-07', time: '08:35', sys: 123, dia: 83, pulse: 67, note: 'Утро' },
  { id: 'r-163', date: '2026-10-07', time: '09:46', sys: 121, dia: 85, pulse: 61, note: 'После кофе' },
  { id: 'r-164', date: '2026-10-07', time: '13:21', sys: 128, dia: 87, pulse: 74, note: 'После кардио, сахар 6.2, сатурация 97%' },
  { id: 'r-165', date: '2026-10-08', time: '08:37', sys: 126, dia: 86, pulse: 64, note: 'Утро' },
  { id: 'r-166', date: '2026-10-08', time: '11:28', sys: 127, dia: 85, pulse: 67, note: 'После завтрака и кофе (одинарный эспрессо)' },
  { id: 'r-167', date: '2026-10-09', time: '08:59', sys: 121, dia: 88, pulse: 59, note: 'Утро (129/86 68 -> 121/88 59)' },
  { id: 'r-168', date: '2026-10-10', time: '10:30', sys: 123, dia: 84, pulse: 62, note: 'Утро (128/85 65 -> 123/84 62)' },
  { id: 'r-169', date: '2026-10-10', time: '12:18', sys: 119, dia: 87, pulse: 61, note: 'После кофе' },
  { id: 'r-170', date: '2026-10-12', time: '08:46', sys: 123, dia: 84, pulse: 64, note: 'Утро' },
  { id: 'r-171', date: '2026-10-13', time: '09:18', sys: 124, dia: 86, pulse: 64, note: 'Утро' },
  { id: 'r-172', date: '2026-10-14', time: '09:31', sys: 120, dia: 84, pulse: 66, note: 'Утро' }
];

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
];

const formatHumanDate = (isoDate) => {
  if (!isoDate) return '';
  const [, mm, dd] = isoDate.split('-');
  const mIdx = parseInt(mm, 10) - 1;
  return `${parseInt(dd, 10)} ${MONTHS_RU[mIdx] || mm}`;
};

const getStatusPill = (sys, dia) => {
  if (sys < 110 || dia < 65) {
    return { text: 'Низкое', bg: '#CDE9F2', color: '#141A16' };
  }
  if (sys < 125 && dia < 83) {
    return { text: 'Оптимально', bg: '#D6EBB4', color: '#141A16' };
  }
  if (sys < 132 && dia < 87) {
    return { text: 'Норма', bg: '#EFEFEF', color: '#141A16' };
  }
  return { text: 'Выше нормы', bg: '#141A16', color: '#FFFFFF' };
};

const parseImportData = (rawText) => {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsed = [];

  lines.forEach((line, idx) => {
    const chatMatch = line.match(/^\[(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}):(\d{2})\][^:]*:\s*(.+)$/);
    if (chatMatch) {
      const [, dd, mm, yyyy, hh, min, content] = chatMatch;
      const isoDate = `${yyyy}-${mm}-${dd}`;
      const timeStr = `${hh.padStart(2, '0')}:${min}`;
      const bpMatches = [...content.matchAll(/(\d{2,3})\/(\d{2,3})(?:\s+(\d{2,3}))?/g)];
      if (bpMatches.length > 0) {
        const last = bpMatches[bpMatches.length - 1];
        let s = parseInt(last[1], 10);
        if (s < 40) s += 100;
        const d = parseInt(last[2], 10);
        const p = last[3] ? parseInt(last[3], 10) : null;
        parsed.push({
          id: `imp-${Date.now()}-${idx}`,
          date: isoDate,
          time: timeStr,
          sys: s,
          dia: d,
          pulse: p && p >= 35 && p <= 200 ? p : null,
          note: content.trim()
        });
        return;
      }
    }

    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})/);
    if (!dateMatch) return;
    let isoDate = dateMatch[1];
    if (isoDate.includes('.')) {
      const [dd, mm, yyyy] = isoDate.split('.');
      isoDate = `${yyyy}-${mm}-${dd}`;
    }
    const timeMatch = line.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '09:00';
    let rest = line.replace(dateMatch[1], '').replace(timeMatch ? timeMatch[0] : '', '');

    const nums = rest.match(/\b\d{2,3}\b/g);
    if (nums && nums.length >= 2) {
      const sys = parseInt(nums[0], 10);
      const dia = parseInt(nums[1], 10);
      const pulse = nums[2] ? parseInt(nums[2], 10) : null;
      const cleanNote = rest
        .replace(nums[0], '')
        .replace(nums[1], '')
        .replace(nums[2] || '', '')
        .replace(/^[;,\s/|-]+|[;,\s/|-]+$/g, '')
        .trim();

      if (sys >= 75 && sys <= 220 && dia >= 45 && dia <= 140) {
        parsed.push({
          id: `imp-${Date.now()}-${idx}`,
          date: isoDate,
          time,
          sys,
          dia,
          pulse: pulse && pulse >= 35 && pulse <= 200 ? pulse : null,
          note: cleanNote || 'Замер'
        });
      }
    }
  });

  return parsed;
};

export function BloodPressureApp() {
  const [records, setRecords] = useState(ROMA_INITIAL_RECORDS);
  const [period, setPeriod] = useState('30d'); // '7d' | '30d' | 'all'
  const [dayTimeFilter, setDayTimeFilter] = useState('all'); // 'all' | 'morning' | 'evening'
  const [visibleCount, setVisibleCount] = useState(30);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bottom sheet state ('add' | 'data' | null)
  const [activeSheet, setActiveSheet] = useState(null);

  // Quick numeric input state inside bottom sheet
  const [sysInput, setSysInput] = useState('');
  const [diaInput, setDiaInput] = useState('');
  const [pulseInput, setPulseInput] = useState('');
  const [noteInput, setNoteInput] = useState('Утро');
  const [dateInput, setDateInput] = useState('2026-10-14');
  const [timeInput, setTimeInput] = useState('09:30');

  const sysRef = useRef(null);
  const diaRef = useRef(null);
  const pulseRef = useRef(null);

  const [importText, setImportText] = useState('');

  useEffect(() => {
    if (activeSheet === 'add') {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setTimeInput(`${hh}:${mm}`);
      const timer = setTimeout(() => {
        if (sysRef.current) sysRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeSheet]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) =>
      `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`)
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (sortedRecords.length === 0) return [];
    const lastDateStr = sortedRecords[sortedRecords.length - 1].date;
    const anchor = new Date(`${lastDateStr}T23:59:59`);

    let cutoff = null;
    if (period === '7d') {
      cutoff = new Date(anchor);
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (period === '30d') {
      cutoff = new Date(anchor);
      cutoff.setDate(cutoff.getDate() - 30);
    }

    return sortedRecords.filter((r) => {
      if (cutoff) {
        const d = new Date(`${r.date}T12:00:00`);
        if (d < cutoff) return false;
      }
      if (dayTimeFilter !== 'all') {
        const hour = parseInt((r.time || '09:00').split(':')[0], 10);
        if (dayTimeFilter === 'morning' && hour >= 13) return false;
        if (dayTimeFilter === 'evening' && hour < 13) return false;
      }
      return true;
    });
  }, [sortedRecords, period, dayTimeFilter]);

  const chartData = useMemo(() => {
    return filteredRecords.map((r) => ({
      ...r,
      shortLabel: formatHumanDate(r.date)
    }));
  }, [filteredRecords]);

  const stats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { avgSys: 120, avgDia: 80, avgPulse: 64, minSys: 110, maxSys: 130, latest: null };
    }
    let sysSum = 0;
    let diaSum = 0;
    let pulseSum = 0;
    let pulseCnt = 0;
    let minSys = Infinity;
    let maxSys = -Infinity;

    filteredRecords.forEach((r) => {
      sysSum += r.sys;
      diaSum += r.dia;
      if (r.pulse) {
        pulseSum += r.pulse;
        pulseCnt += 1;
      }
      if (r.sys < minSys) minSys = r.sys;
      if (r.sys > maxSys) maxSys = r.sys;
    });

    const cnt = filteredRecords.length;
    return {
      avgSys: Math.round(sysSum / cnt),
      avgDia: Math.round(diaSum / cnt),
      avgPulse: pulseCnt > 0 ? Math.round(pulseSum / pulseCnt) : 64,
      minSys,
      maxSys,
      latest: sortedRecords[sortedRecords.length - 1]
    };
  }, [filteredRecords, sortedRecords]);

  const handleSysChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setSysInput(val);
    if (val.length === 3 || (val.length === 2 && parseInt(val, 10) >= 85 && parseInt(val, 10) <= 99)) {
      if (diaRef.current) diaRef.current.focus();
    }
  };

  const handleDiaChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setDiaInput(val);
    if (val.length === 2 && parseInt(val, 10) >= 45) {
      if (pulseRef.current) pulseRef.current.focus();
    }
  };

  const handlePulseChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setPulseInput(val);
  };

  const handleSaveRecord = (e) => {
    e.preventDefault();
    const s = parseInt(sysInput, 10);
    const d = parseInt(diaInput, 10);
    const p = pulseInput ? parseInt(pulseInput, 10) : null;

    if (!s || !d || s < 70 || d < 40) return;

    const newItem = {
      id: `r-${Date.now()}`,
      date: dateInput,
      time: timeInput,
      sys: s,
      dia: d,
      pulse: p,
      note: noteInput.trim() || 'Утро'
    };

    setRecords((prev) => [...prev, newItem]);
    setSysInput('');
    setDiaInput('');
    setPulseInput('');
    setActiveSheet(null);
  };

  const handleDelete = (id) => {
    setRecords((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExportCSV = () => {
    const header = 'Дата;Время;Верхнее;Нижнее;Пульс;Заметка\n';
    const body = [...sortedRecords]
      .reverse()
      .map((r) => `${r.date};${r.time};${r.sys};${r.dia};${r.pulse || ''};${r.note || ''}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pressure_roma_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    const parsed = parseImportData(importText);
    if (parsed.length > 0) {
      setRecords((prev) => [...prev, ...parsed]);
      setImportText('');
      setActiveSheet(null);
    }
  };

  const feedRecords = useMemo(() => {
    const rev = [...filteredRecords].reverse();
    if (!searchQuery.trim()) return rev;
    const q = searchQuery.toLowerCase();
    return rev.filter(
      (r) =>
        (r.note && r.note.toLowerCase().includes(q)) ||
        r.date.includes(q) ||
        `${r.sys}/${r.dia}`.includes(q)
    );
  }, [filteredRecords, searchQuery]);

  const latestRec = stats.latest;

  return (
    <div className="min-h-screen bg-[#E2E5E2] text-[#141A16] flex justify-center font-sans selection:bg-[#D6EBB4]">
      {/* Mobile viewport container */}
      <div className="w-full max-w-[440px] min-h-screen bg-[#EFEFEF] pb-32 px-5 pt-7 relative flex flex-col">
        
        {/* Large clean header without eyebrows or subtitles */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-[38px] font-bold tracking-tight leading-none text-[#141A16]">
            Давление
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#141A16] active:scale-95 transition cursor-pointer"
              aria-label="Поиск"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveSheet('data')}
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#141A16] active:scale-95 transition cursor-pointer"
              aria-label="База данных"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Expandable search bar */}
        {searchOpen && (
          <div className="mb-5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти: кофе, трени, сахар, утро..."
              className="w-full bg-white rounded-[22px] px-5 py-4 text-base text-[#141A16] placeholder-[#858D88] focus:outline-none"
            />
          </div>
        )}

        {/* Segmented period pill selector */}
        <div className="bg-white rounded-full p-1.5 grid grid-cols-3 mb-5">
          {[
            { id: '7d', label: 'Неделя' },
            { id: '30d', label: 'Месяц' },
            { id: 'all', label: 'Год' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`py-3 rounded-full text-[15px] font-semibold transition cursor-pointer ${
                period === tab.id
                  ? 'bg-[#141A16] text-white'
                  : 'text-[#6E7671] hover:text-[#141A16]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {}
        <section className="bg-white rounded-[32px] p-6 mb-4">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[44px] font-bold tracking-tight leading-none text-[#141A16]">
                {stats.avgSys}/{stats.avgDia}
              </span>
              <span className="text-base font-medium text-[#7A827D]">ср.</span>
            </div>
            <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#D6EBB4] text-[#141A16]">
              В норме
            </span>
          </div>

          <p className="text-[15px] text-[#7A827D] mb-5">
            Коридор {stats.minSys}–{stats.maxSys} · {filteredRecords.length} зам.
          </p>

          <div className="h-[195px] w-full -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="sysFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D6EBB4" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#D6EBB4" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="diaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CDE9F2" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#CDE9F2" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="shortLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#858D88' }}
                  minTickGap={36}
                />
                <YAxis
                  domain={[65, 140]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#858D88' }}
                  ticks={[75, 100, 125]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#141A16] text-white rounded-[22px] px-4 py-3 shadow-lg">
                        <div className="text-sm text-[#A3ABA6] mb-0.5">
                          {formatHumanDate(item.date)} · {item.time}
                        </div>
                        <div className="text-xl font-bold">
                          {item.sys}/{item.dia}{' '}
                          {item.pulse && (
                            <span className="text-sm font-normal text-[#D6EBB4] ml-1">
                              ♥ {item.pulse}
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <div className="text-sm text-[#E2E6E3] mt-1 max-w-[210px] leading-snug">
                            {item.note}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sys"
                  stroke="#141A16"
                  strokeWidth={2.5}
                  fill="url(#sysFill)"
                  activeDot={{ r: 6, fill: '#141A16', stroke: '#D6EBB4', strokeWidth: 3 }}
                />
                <Area
                  type="monotone"
                  dataKey="dia"
                  stroke="#72B0BE"
                  strokeWidth={2.2}
                  fill="url(#diaFill)"
                  activeDot={{ r: 5, fill: '#72B0BE', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {}
        <section className="grid grid-cols-2 gap-3.5 mb-7">
          <div className="bg-[#CDE9F2] rounded-[28px] p-5 flex flex-col justify-between min-h-[148px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[28px] font-bold leading-tight text-[#141A16]">
                  {latestRec ? `${latestRec.sys}/${latestRec.dia}` : '—'}
                </div>
                <div className="text-[15px] text-[#49656E] font-medium mt-0.5">
                  {latestRec ? formatHumanDate(latestRec.date) : 'Нет данных'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16] shrink-0">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-base font-semibold text-[#141A16] mt-4">
              Последний замер
            </div>
          </div>

          <div className="bg-[#D6EBB4] rounded-[28px] p-5 flex flex-col justify-between min-h-[148px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[28px] font-bold leading-tight text-[#141A16]">
                  {stats.avgPulse}
                </div>
                <div className="text-[15px] text-[#526634] font-medium mt-0.5">
                  уд/мин
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16] shrink-0">
                <Heart className="w-5 h-5" />
              </div>
            </div>
            <div className="text-base font-semibold text-[#141A16] mt-4">
              Средний пульс
            </div>
          </div>
        </section>

        {}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#141A16]">История</h2>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'Все' },
              { id: 'morning', label: 'Утро' },
              { id: 'evening', label: 'Вечер' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDayTimeFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition cursor-pointer ${
                  dayTimeFilter === f.id
                    ? 'bg-[#141A16] text-white'
                    : 'bg-white text-[#6E7671]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {}
        <section className="space-y-3">
          {feedRecords.slice(0, visibleCount).map((item) => {
            const badge = getStatusPill(item.sys, item.dia);
            return (
              <div
                key={item.id}
                className="bg-white rounded-[26px] px-5 py-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-[24px] font-bold tracking-tight text-[#141A16]">
                      {item.sys}/{item.dia}
                    </span>
                    {item.pulse && (
                      <span className="text-base font-semibold text-[#72B0BE]">
                        ♥ {item.pulse}
                      </span>
                    )}
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.text}
                    </span>
                  </div>
                  <div className="text-[15px] text-[#5A625D] mt-1 truncate">
                    {item.note || 'Замер'}
                  </div>
                  <div className="text-sm text-[#8F9691] mt-0.5">
                    {formatHumanDate(item.date)} в {item.time}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#B0B7B2] hover:text-[#141A16] active:scale-95 transition cursor-pointer shrink-0"
                  title="Удалить запись"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {visibleCount < feedRecords.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 30)}
              className="w-full py-4 rounded-[24px] bg-white text-[#141A16] font-semibold text-base active:scale-[0.99] transition cursor-pointer"
            >
              Показать еще ({feedRecords.length - visibleCount})
            </button>
          )}
        </section>

        {}
        <div className="fixed bottom-5 left-0 right-0 z-30 flex justify-center pointer-events-none px-5">
          <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-md rounded-full p-2 shadow-lg flex items-center justify-between pointer-events-auto">
            <div className="pl-4">
              <div className="text-sm font-semibold text-[#141A16]">
                Новый замер
              </div>
              <div className="text-xs text-[#7A827D]">
                Быстрый ввод одной рукой
              </div>
            </div>
            <button
              onClick={() => setActiveSheet('add')}
              className="px-6 py-3.5 rounded-full bg-[#141A16] text-white font-semibold text-base flex items-center gap-2 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Записать
            </button>
          </div>
        </div>

        {}
        {activeSheet === 'add' && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center"
            onClick={() => setActiveSheet(null)}
          >
            <div
              className="w-full max-w-[440px] bg-[#EFEFEF] rounded-t-[36px] p-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[#C8CFCB] rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[28px] font-bold text-[#141A16] leading-none">
                  Новый замер
                </h3>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRecord} className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-[26px] p-4 text-center">
                    <span className="block text-sm font-medium text-[#7A827D] mb-1">
                      Верхнее
                    </span>
                    <input
                      ref={sysRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="120"
                      value={sysInput}
                      onChange={handleSysChange}
                      className="w-full text-center text-[34px] font-bold text-[#141A16] placeholder-[#D0D5D2] focus:outline-none bg-transparent"
                      required
                    />
                  </div>

                  <div className="bg-white rounded-[26px] p-4 text-center">
                    <span className="block text-sm font-medium text-[#7A827D] mb-1">
                      Нижнее
                    </span>
                    <input
                      ref={diaRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="82"
                      value={diaInput}
                      onChange={handleDiaChange}
                      className="w-full text-center text-[34px] font-bold text-[#141A16] placeholder-[#D0D5D2] focus:outline-none bg-transparent"
                      required
                    />
                  </div>

                  <div className="bg-[#D6EBB4] rounded-[26px] p-4 text-center">
                    <span className="block text-sm font-medium text-[#4A5D2F] mb-1">
                      Пульс
                    </span>
                    <input
                      ref={pulseRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="64"
                      value={pulseInput}
                      onChange={handlePulseChange}
                      className="w-full text-center text-[34px] font-bold text-[#141A16] placeholder-[#99B277] focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Утро',
                    'После кофе',
                    'После силовой',
                    'После кардио',
                    'Вечером после прогулки'
                  ].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setNoteInput(tag)}
                      className={`px-4 py-2.5 rounded-full text-[15px] font-semibold transition cursor-pointer ${
                        noteInput === tag
                          ? 'bg-[#141A16] text-white'
                          : 'bg-white text-[#141A16]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-[24px] px-4 py-3.5 flex items-center gap-3">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Комментарий (напр. сахар 5.4)"
                    className="flex-1 text-base text-[#141A16] placeholder-[#8F9691] focus:outline-none bg-transparent"
                  />
                  <input
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="text-base font-semibold text-[#141A16] bg-[#EFEFEF] rounded-full px-3 py-1 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-[#141A16] text-white text-lg font-semibold active:scale-[0.99] transition cursor-pointer"
                >
                  Сохранить замер
                </button>
              </form>
            </div>
          </div>
        )}

        {}
        {activeSheet === 'data' && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center"
            onClick={() => setActiveSheet(null)}
          >
            <div
              className="w-full max-w-[440px] bg-[#EFEFEF] rounded-t-[36px] p-6 pb-8 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[#C8CFCB] rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[26px] font-bold text-[#141A16]">
                  База замеров
                </h3>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white rounded-[26px] p-4 space-y-3">
                <div className="text-base font-semibold text-[#141A16]">
                  Добавить строчки из лога
                </div>
                <textarea
                  rows={4}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="[15.10.2026 08:40] Roma Lebedev: 120/80 64 утро"
                  className="w-full bg-[#EFEFEF] rounded-[18px] p-3 text-sm text-[#141A16] focus:outline-none"
                />
                <button
                  onClick={handleImportSubmit}
                  className="w-full py-3.5 rounded-full bg-[#141A16] text-white font-semibold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Импортировать записи
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportCSV}
                  className="bg-white rounded-[24px] py-4 px-4 font-semibold text-base text-[#141A16] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Выгрузить CSV
                </button>
                <button
                  onClick={() => {
                    setRecords(ROMA_INITIAL_RECORDS);
                    setActiveSheet(null);
                  }}
                  className="bg-[#CDE9F2] rounded-[24px] py-4 px-4 font-semibold text-base text-[#141A16] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Сбросить к базе
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}