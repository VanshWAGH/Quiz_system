<?php
include 'db.php';

$sql = "SELECT name, score, time_taken, total_questions 
        FROM students_scores 
        ORDER BY score DESC, time_taken ASC 
        LIMIT 10";
$result = $conn->query($sql);

$leaderboard = [];
while ($row = $result->fetch_assoc()) {
    $leaderboard[] = [
        'name' => $row['name'],
        'score' => $row['score'],
        'time' => $row['time_taken'],
        'total' => $row['total_questions']
    ];
}

echo json_encode($leaderboard);
?>