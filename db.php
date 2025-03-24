<?php
$host = "localhost";
$user = "root";
$pass = "324211@Mysql";
$dbname = "quiz_db";

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}
?>
