        // Elements
        const timeDisplay = document.getElementById('time');
        const modeDisplay = document.getElementById('mode');
        const timerCircle = document.getElementById('timer-circle');
        const startBtn = document.getElementById('start-btn');
        const resetBtn = document.getElementById('reset-btn');
        const skipBtn = document.getElementById('skip-btn');
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        const nextModeInfo = document.getElementById('next-mode');
        const sessionDots = document.querySelectorAll('.session-dot');

        // Pomodoro Settings
        const POMODORO_TIME = 25 * 60; // 25 minutes in seconds
        const SHORT_BREAK_TIME = 5 * 60; // 5 minutes in seconds
        const LONG_BREAK_TIME = 15 * 60; // 15 minutes in seconds
        const SESSIONS_BEFORE_LONG_BREAK = 4;

        // Timer variables
        let timerInterval;
        let currentTime = POMODORO_TIME;
        let isRunning = false;
        let currentMode = "pomodoro"; // pomodoro, shortBreak, longBreak
        let sessionsCompleted = 0;
        let totalTimeInCurrentMode = POMODORO_TIME;

        // Sound effects (using AudioContext for better mobile support)
        let audioContext;
        
        // Initialize timer display
        updateTimerDisplay();
        updateNextModeInfo();

        // Initialize audio context on first user interaction
        function initAudio() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        // Play a beep sound when timer completes
        function playSound(type) {
            if (!audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'complete') {
                oscillator.type = 'sine';
                oscillator.frequency.value = 800;
                gainNode.gain.value = 0.5;
                oscillator.start();
                setTimeout(() => {
                    oscillator.stop();
                }, 500);
            } else if (type === 'click') {
                oscillator.type = 'sine';
                oscillator.frequency.value = 600;
                gainNode.gain.value = 0.2;
                oscillator.start();
                setTimeout(() => {
                    oscillator.stop();
                }, 100);
            }
        }

        // Event listeners
        startBtn.addEventListener('click', () => {
            initAudio(); // Initialize audio on user interaction
            playSound('click');
            toggleTimer();
        });

        resetBtn.addEventListener('click', () => {
            playSound('click');
            resetTimer();
        });

        skipBtn.addEventListener('click', () => {
            playSound('click');
            skipToNextMode();
        });

        // Timer functions
        function toggleTimer() {
            if (isRunning) {
                clearInterval(timerInterval);
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            } else {
                timerInterval = setInterval(updateTimer, 1000);
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            }
            isRunning = !isRunning;
        }

        function updateTimer() {
            if (currentTime <= 0) {
                clearInterval(timerInterval);
                playSound('complete');
                
                // Handle timer completion based on current mode
                if (currentMode === "pomodoro") {
                    sessionsCompleted++;
                    updateSessionDots();
                    
                    if (sessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
                        setMode("longBreak");
                    } else {
                        setMode("shortBreak");
                    }
                } else {
                    setMode("pomodoro");
                }
                
                isRunning = false;
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                
                // Request permission for notification
                if (Notification.permission === "granted") {
                    new Notification("Pomodoro Timer", { 
                        body: `${currentMode === "pomodoro" ? "Hora da pausa!" : "Hora de focar!"}`,
                        icon: "https://cdn.jsdelivr.net/npm/@mdi/svg@7.2.96/svg/timer.svg" 
                    });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission();
                }
                
                updateNextModeInfo();
            } else {
                currentTime--;
                updateTimerDisplay();
                updateCircleProgress();
            }
        }

        function resetTimer() {
            clearInterval(timerInterval);
            setMode(currentMode); // Reset time but keep the same mode
            isRunning = false;
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }

        function skipToNextMode() {
            clearInterval(timerInterval);
            isRunning = false;
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            
            // Skip to next mode
            if (currentMode === "pomodoro") {
                if (sessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === SESSIONS_BEFORE_LONG_BREAK - 1) {
                    setMode("longBreak");
                } else {
                    setMode("shortBreak");
                }
            } else {
                setMode("pomodoro");
            }
            
            updateNextModeInfo();
        }

        function setMode(mode) {
            currentMode = mode;
            
            // Update timer based on mode
            switch (mode) {
                case "pomodoro":
                    currentTime = POMODORO_TIME;
                    totalTimeInCurrentMode = POMODORO_TIME;
                    modeDisplay.textContent = "Foco";
                    timerCircle.style.background = `conic-gradient(var(--timer-color) 0%, #ecf0f1 0%)`;
                    break;
                case "shortBreak":
                    currentTime = SHORT_BREAK_TIME;
                    totalTimeInCurrentMode = SHORT_BREAK_TIME;
                    modeDisplay.textContent = "Pausa Curta";
                    timerCircle.style.background = `conic-gradient(var(--break-color) 0%, #ecf0f1 0%)`;
                    break;
                case "longBreak":
                    currentTime = LONG_BREAK_TIME;
                    totalTimeInCurrentMode = LONG_BREAK_TIME;
                    modeDisplay.textContent = "Pausa Longa";
                    timerCircle.style.background = `conic-gradient(var(--long-break-color) 0%, #ecf0f1 0%)`;
                    break;
            }
            
            updateTimerDisplay();
            updateNextModeInfo();
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(currentTime / 60);
            const seconds = currentTime % 60;
            
            timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            updateCircleProgress();
        }

        function updateCircleProgress() {
            const progress = (1 - currentTime / totalTimeInCurrentMode) * 100;
            let color;
            
            switch (currentMode) {
                case "pomodoro":
                    color = "var(--timer-color)";
                    break;
                case "shortBreak":
                    color = "var(--break-color)";
                    break;
                case "longBreak":
                    color = "var(--long-break-color)";
                    break;
            }
            
            timerCircle.style.background = `conic-gradient(${color} ${progress}%, #ecf0f1 ${progress}%)`;
        }

        function updateSessionDots() {
            for (let i = 0; i < sessionDots.length; i++) {
                if (i < (sessionsCompleted % SESSIONS_BEFORE_LONG_BREAK)) {
                    sessionDots[i].classList.add('completed');
                } else {
                    sessionDots[i].classList.remove('completed');
                }
            }
        }

        function updateNextModeInfo() {
            if (currentMode === "pomodoro") {
                if (sessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === SESSIONS_BEFORE_LONG_BREAK - 1) {
                    nextModeInfo.textContent = "Próximo: Pausa longa (15 min)";
                } else {
                    nextModeInfo.textContent = "Próximo: Pausa curta (5 min)";
                }
            } else {
                nextModeInfo.textContent = "Próximo: Foco (25 min)";
            }
        }

        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }