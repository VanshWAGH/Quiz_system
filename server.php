<?php
header('Content-Type: application/json');
$questions = file_get_contents("questions.json");
echo $questions;
?>
