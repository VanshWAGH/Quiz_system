<?php
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

// Validate and sanitize input
$name = filter_var($data['name'], FILTER_SANITIZE_STRING);
$score = (int)$data['score'];
$time = (int)$data['time'];
$totalQuestions = (int)$data['totalQuestions'];

// Prepare and execute SQL statement
$stmt = $conn->prepare("INSERT INTO students_scores (name, score, time_taken, total_questions) VALUES (?, ?, ?, ?)");
$stmt->bind_param("siii", $name, $score, $time, $totalQuestions);
$stmt->execute();
$stmt->close();

echo json_encode(["message" => "Score recorded successfully"]);
?>