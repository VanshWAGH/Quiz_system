let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let quizTimer;
let timeLeft = 300; // 5 minutes in seconds
let quizStartTime;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    document.getElementById('prev-btn').addEventListener('click', prevQuestion);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('review-btn').addEventListener('click', showReviewScreen);
    document.getElementById('submit-btn').addEventListener('click', showReviewScreen);
    document.getElementById('return-to-quiz').addEventListener('click', returnToQuiz);
    document.getElementById('confirm-submit').addEventListener('click', submitQuiz);
    document.getElementById('try-again').addEventListener('click', restartQuiz);

    // Load quiz data
    fetchQuestions();
    fetchLeaderboard();
});

function startTimer() {
    quizStartTime = new Date();
    quizTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if(timeLeft <= 0) {
            clearInterval(quizTimer);
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
    // Add warning when time is running low
    if (timeLeft <= 60) {
        document.getElementById('timer').style.color = '#f72585';
    }
}

function fetchQuestions() {
    fetch('server.php')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            document.getElementById('total-questions').textContent = quizData.length;
            startTimer();
            showQuestion();
        })
        .catch(error => {
            document.getElementById('question-text').textContent = 'Failed to load questions. Please try again.';
            console.error('Error:', error);
        });
}

function showQuestion() {
    if (quizData.length === 0) return;
    
    document.getElementById('quiz-screen').style.display = 'block';
    document.getElementById('quiz').style.display = 'block';
    document.getElementById('review-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    
    const question = quizData[currentQuestionIndex];
    document.getElementById('question-text').textContent = question.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    ['A', 'B', 'C', 'D'].forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        if (userAnswers[question.id] === option) {
            optionDiv.classList.add('selected');
        }
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'question_' + question.id;
        input.value = option;
        input.id = 'q' + question.id + '_' + option;
        input.addEventListener('change', () => selectAnswer(question.id, option));
        
        const label = document.createElement('label');
        label.htmlFor = 'q' + question.id + '_' + option;
        label.textContent = question.options[option];
        
        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
    document.getElementById('next-btn').style.display = 
        currentQuestionIndex === quizData.length - 1 ? 'none' : 'block';
    document.getElementById('review-btn').style.display = 
        currentQuestionIndex === quizData.length - 1 ? 'block' : 'none';
    document.getElementById('submit-btn').style.display = 'none';
    
    updateProgress();
    updateQuestionNav();
}

function selectAnswer(questionId, answer) {
    userAnswers[questionId] = answer;
    updateProgress();
    updateQuestionNav();
}

function updateProgress() {
    const answered = Object.keys(userAnswers).length;
    document.getElementById('progress').textContent = answered;
    document.querySelector('.progress-fill').style.width = 
        `${(answered / quizData.length) * 100}%`;
}

function updateQuestionNav() {
    const navContainer = document.getElementById('question-nav');
    navContainer.innerHTML = '';
    
    quizData.forEach((q, index) => {
        const btn = document.createElement('div');
        btn.className = 'question-number';
        btn.textContent = index + 1;
        
        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        } else if (userAnswers[q.id]) {
            btn.classList.add('answered');
        }
        
        btn.addEventListener('click', () => {
            currentQuestionIndex = index;
            showQuestion();
        });
        
        navContainer.appendChild(btn);
    });
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    }
}

function showReviewScreen() {
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('review-screen').style.display = 'block';
    
    const reviewContainer = document.getElementById('review-questions');
    reviewContainer.innerHTML = '';
    
    quizData.forEach((q, index) => {
        const reviewItem = document.createElement('div');
        reviewItem.className = `review-item ${userAnswers[q.id] ? 'answered' : 'unanswered'}`;
        
        const questionText = document.createElement('div');
        questionText.className = 'review-question';
        questionText.textContent = `Q${index + 1}: ${q.question.substring(0, 50)}${q.question.length > 50 ? '...' : ''}`;
        
        const answerStatus = document.createElement('div');
        answerStatus.className = 'review-answer';
        answerStatus.textContent = userAnswers[q.id] ? '✔ Answered' : '✖ Skipped';
        
        reviewItem.appendChild(questionText);
        reviewItem.appendChild(answerStatus);
        reviewContainer.appendChild(reviewItem);
        
        // Make review items clickable to jump to question
        reviewItem.addEventListener('click', () => {
            currentQuestionIndex = index;
            returnToQuiz();
        });
    });
}

function returnToQuiz() {
    showQuestion();
}

function submitQuiz() {
    clearInterval(quizTimer);
    
    const username = document.getElementById('username').value.trim();
    if (username === '') {
        alert('Please enter your name before submitting');
        returnToQuiz();
        return;
    }
    
    // Calculate score and prepare results
    let score = 0;
    const results = quizData.map(q => {
        const userAnswer = userAnswers[q.id];
        const isCorrect = userAnswer === q.correct_option;
        if (isCorrect) score++;
        
        return {
            question: q.question,
            userAnswer: userAnswer ? q.options[userAnswer] : 'Not answered',
            correctAnswer: q.options[q.correct_option],
            isCorrect,
            optionSelected: userAnswer
        };
    });
    
    // Calculate time taken
    const endTime = new Date();
    const timeTaken = Math.floor((endTime - quizStartTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    
    // Show results screen
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    // Display summary
    document.getElementById('result-summary').innerHTML = `
        <p>Player: <strong>${username}</strong></p>
        <p>Score: <strong>${score}/${quizData.length}</strong></p>
        <p>Time Taken: <strong>${minutes}m ${seconds}s</strong></p>
        <p>Percentage: <strong>${Math.round((score/quizData.length)*100)}%</strong></p>
    `;
    
    // Display detailed results
    const detailedResults = document.getElementById('detailed-results');
    detailedResults.innerHTML = '<h3>Question Breakdown:</h3>';
    
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${result.isCorrect ? 'correct' : 'incorrect'}`;
        
        resultItem.innerHTML = `
            <h4>Q${index + 1}: ${result.question}</h4>
            <p>Your answer: <span class="user-answer ${result.isCorrect ? 'correct' : 'incorrect'}">${result.userAnswer}</span></p>
            ${!result.isCorrect ? `
                <p>Correct answer: <span class="correct-answer">${result.correctAnswer}</span></p>
                ${result.optionSelected ? `<p>You selected: <strong>${result.optionSelected}</strong></p>` : ''}
            ` : ''}
        `;
        
        detailedResults.appendChild(resultItem);
    });
    
    // Submit to server
    fetch('submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: username, 
            score: score,
            time: timeTaken,
            answers: userAnswers,
            totalQuestions: quizData.length
        })
    })
    .then(response => response.json())
    .then(() => fetchLeaderboard())
    .catch(error => {
        console.error('Error:', error);
    });
}

function fetchLeaderboard() {
    fetch('leaderboard.php')
        .then(response => response.json())
        .then(data => {
            const leaderboardTable = document.getElementById('leaderboard');
            // Clear existing rows except header
            while (leaderboardTable.rows.length > 1) {
                leaderboardTable.deleteRow(1);
            }
            
            // Add new rows
            data.forEach((entry, index) => {
                const row = leaderboardTable.insertRow();
                const rankCell = row.insertCell(0);
                const nameCell = row.insertCell(1);
                const scoreCell = row.insertCell(2);
                const timeCell = row.insertCell(3);
                
                const minutes = Math.floor(entry.time / 60);
                const seconds = entry.time % 60;
                
                rankCell.textContent = index + 1;
                nameCell.textContent = entry.name;
                scoreCell.textContent = `${entry.score}/${entry.total}`;
                timeCell.textContent = `${minutes}m ${seconds}s`;
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function restartQuiz() {
    // Reset quiz state
    currentQuestionIndex = 0;
    userAnswers = {};
    timeLeft = 300;
    
    // Reset UI
    document.getElementById('timer').style.color = '#f1c40f';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('username').value = '';
    
    // Restart timer and quiz
    startTimer();
    showQuestion();
}


function fetchLeaderboard() {
    fetch('leaderboard.php')
        .then(response => response.json())
        .then(data => {
            const leaderboardTable = document.getElementById('leaderboard');
            // Clear existing rows except header
            while (leaderboardTable.rows.length > 1) {
                leaderboardTable.deleteRow(1);
            }
            
            // Add new rows with proper formatting
            data.forEach((entry, index) => {
                const row = leaderboardTable.insertRow();
                const rankCell = row.insertCell(0);
                const nameCell = row.insertCell(1);
                const scoreCell = row.insertCell(2);
                const timeCell = row.insertCell(3);
                
                // Format time (convert seconds to minutes:seconds)
                const minutes = Math.floor(entry.time / 60);
                const seconds = entry.time % 60;
                const timeString = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
                
                rankCell.textContent = index + 1;
                nameCell.textContent = entry.name;
                scoreCell.textContent = `${entry.score}/${entry.total || '?'}`;
                timeCell.textContent = timeString;
            });
        })
        .catch(error => {
            console.error('Error loading leaderboard:', error);
            document.getElementById('leaderboard').innerHTML += 
                '<tr><td colspan="4">Error loading leaderboard</td></tr>';
        });
}