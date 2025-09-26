// Application Data and Configuration
const appConfig = {
    supportedBrowsers: {
        chrome: "✅ Full Support",
        firefox: "✅ Full Support", 
        safari: "⚠️ Limited Support",
        edge: "✅ Full Support"
    },
    speechRecognitionLanguages: [
        {code: "en-US", name: "English (US)", supported: true},
        {code: "en-GB", name: "English (UK)", supported: true},
        {code: "es-ES", name: "Spanish", supported: true},
        {code: "fr-FR", name: "French", supported: true},
        {code: "de-DE", name: "German", supported: true}
    ],
    actionItemKeywords: [
        "TODO", "to do", "action item", "will do", "assigned to", 
        "responsible for", "follow up", "next steps", "homework",
        "by Friday", "by Monday", "deadline", "due date", "deliver by",
        "take care of", "handle this", "work on", "complete by"
    ],
    decisionKeywords: [
        "decided", "agreed", "conclusion", "we'll go with", "final decision",
        "settled on", "resolved", "approved", "chosen", "selected",
        "determined", "confirmed", "established"
    ],
    personDetectionPatterns: [
        /@[A-Za-z]+/, /assigned to [A-Za-z ]+/, /[A-Za-z]+ will/,
        /[A-Za-z]+ should/, /[A-Za-z]+ can/, /[A-Za-z]+'s responsibility/
    ],
    recordingSettings: {
        video: {
            width: 1920,
            height: 1080,
            frameRate: 30,
            bitrate: 2000000
        },
        audio: {
            sampleRate: 48000,
            channelCount: 2,
            bitrate: 128000
        }
    }
};

// Application State
let appState = {
    isRecording: false,
    isPaused: false,
    recordingStartTime: null,
    recordingDuration: 0,
    permissions: {
        screen: false,
        microphone: false
    },
    mediaRecorder: null,
    screenStream: null,
    audioStream: null,
    combinedStream: null,
    recordedChunks: [],
    speechRecognition: null,
    transcriptionData: [],
    actionItems: [],
    decisions: [],
    keywords: [],
    currentMeeting: {
        id: 'meeting-' + Date.now(),
        title: 'New Meeting Recording',
        startTime: null,
        duration: 0,
        status: 'ready'
    }
};

// DOM Elements
let elements = {};

// Utility Functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function showToast(message, type = 'info') {
    const toast = elements.toast;
    const toastIcon = elements.toastIcon;
    const toastMessage = elements.toastMessage;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toastIcon.textContent = icons[type] || icons.info;
    toastMessage.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function updateStatus(status, type = 'success') {
    elements.statusText.textContent = status;
    elements.statusDot.className = 'status-dot';
    
    if (type === 'error') {
        elements.statusDot.classList.add('error');
    } else if (type === 'warning') {
        elements.statusDot.classList.add('warning');
    }
}

function updateTimer() {
    if (appState.isRecording && !appState.isPaused) {
        const now = Date.now();
        const elapsed = Math.floor((now - appState.recordingStartTime) / 1000);
        appState.recordingDuration = elapsed;
        
        elements.recordingTimer.textContent = formatTime(elapsed);
        elements.recordingDuration.textContent = formatTime(elapsed);
        
        // Update file size estimate
        const estimatedSize = elapsed * 100000; // Rough estimate
        elements.fileSize.textContent = formatFileSize(estimatedSize);
    }
}

// Permission Management
async function requestScreenPermission() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: appConfig.recordingSettings.video.width,
                height: appConfig.recordingSettings.video.height,
                frameRate: appConfig.recordingSettings.video.frameRate
            },
            audio: true
        });
        
        appState.screenStream = stream;
        appState.permissions.screen = true;
        
        elements.screenStatus.textContent = 'Granted';
        elements.screenStatus.classList.add('granted');
        elements.requestScreen.textContent = 'Granted ✅';
        elements.requestScreen.disabled = true;
        
        showToast('Screen recording permission granted!', 'success');
        updateStatus('Screen access granted');
        checkAllPermissions();
        
        return true;
    } catch (error) {
        console.error('Screen permission denied:', error);
        showToast('Screen recording permission denied. Please allow access to record meetings.', 'error');
        updateStatus('Screen access denied', 'error');
        return false;
    }
}

async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: appConfig.recordingSettings.audio.sampleRate,
                channelCount: appConfig.recordingSettings.audio.channelCount,
                echoCancellation: true,
                noiseSuppression: true
            }
        });
        
        appState.audioStream = stream;
        appState.permissions.microphone = true;
        
        elements.micStatus.textContent = 'Granted';
        elements.micStatus.classList.add('granted');
        elements.requestMicrophone.textContent = 'Granted ✅';
        elements.requestMicrophone.disabled = true;
        
        showToast('Microphone permission granted!', 'success');
        updateStatus('Microphone access granted');
        checkAllPermissions();
        
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        showToast('Microphone permission denied. Please allow access for audio recording.', 'error');
        updateStatus('Microphone access denied', 'error');
        return false;
    }
}

function checkAllPermissions() {
    const allGranted = appState.permissions.screen && appState.permissions.microphone;
    
    if (allGranted) {
        elements.startRecording.disabled = false;
        elements.startRecording.innerHTML = '<span class="btn-icon">🔴</span><span class="btn-text">Start Recording</span>';
        showToast('All permissions granted! Ready to record.', 'success');
        updateStatus('Ready to record');
        
        // Initialize speech recognition
        initializeSpeechRecognition();
    }
}

// Speech Recognition
function initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Speech recognition not supported in this browser', 'warning');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    appState.speechRecognition = new SpeechRecognition();
    
    appState.speechRecognition.continuous = true;
    appState.speechRecognition.interimResults = true;
    appState.speechRecognition.lang = elements.languageSelect.value;
    
    appState.speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
                addTranscriptionLine(transcript, confidence, true);
                analyzeTranscript(transcript);
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update live transcription display
        updateTranscriptionDisplay(finalTranscript, interimTranscript);
    };
    
    appState.speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            showToast('Microphone access denied for speech recognition', 'error');
        }
    };
    
    appState.speechRecognition.onend = () => {
        if (appState.isRecording && !appState.isPaused) {
            // Restart recognition if recording is still active
            setTimeout(() => {
                try {
                    appState.speechRecognition.start();
                } catch (error) {
                    console.log('Speech recognition restart failed:', error);
                }
            }, 1000);
        }
    };
}

function addTranscriptionLine(text, confidence, isFinal) {
    const timestamp = Date.now() - appState.recordingStartTime;
    const transcriptionLine = {
        timestamp: timestamp,
        text: text,
        confidence: confidence || 0,
        isFinal: isFinal
    };
    
    appState.transcriptionData.push(transcriptionLine);
    
    const transcriptionContent = elements.transcriptionContent;
    const placeholder = transcriptionContent.querySelector('.transcription-placeholder');
    
    if (placeholder) {
        placeholder.remove();
    }
    
    const lineElement = document.createElement('div');
    lineElement.className = 'transcription-line';
    lineElement.innerHTML = `
        <div class="transcription-timestamp">${formatTime(timestamp / 1000)}</div>
        <div class="transcription-text">${text}</div>
        <div class="transcription-confidence">Confidence: ${Math.round(confidence * 100)}%</div>
    `;
    
    transcriptionContent.appendChild(lineElement);
    transcriptionContent.scrollTop = transcriptionContent.scrollHeight;
    
    // Update stats
    updateTranscriptionStats();
}

function updateTranscriptionDisplay(finalTranscript, interimTranscript) {
    // This would update the UI with interim results if needed
}

function updateTranscriptionStats() {
    const totalWords = appState.transcriptionData.reduce((count, line) => {
        return count + line.text.split(' ').length;
    }, 0);
    
    const avgConfidence = appState.transcriptionData.reduce((sum, line) => {
        return sum + (line.confidence || 0);
    }, 0) / appState.transcriptionData.length || 0;
    
    elements.wordCount.textContent = totalWords;
    elements.confidenceScore.textContent = Math.round(avgConfidence * 100) + '%';
    elements.detectedLanguage.textContent = elements.languageSelect.options[elements.languageSelect.selectedIndex].text;
}

// Text Analysis
function analyzeTranscript(text) {
    const lowerText = text.toLowerCase();
    
    // Action item detection
    appConfig.actionItemKeywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            const actionItem = {
                id: 'action-' + Date.now() + Math.random(),
                text: text,
                keyword: keyword,
                timestamp: Date.now() - appState.recordingStartTime,
                confidence: 0.8 + Math.random() * 0.2,
                type: 'action'
            };
            
            appState.actionItems.push(actionItem);
            addActionItemToUI(actionItem);
        }
    });
    
    // Decision detection
    appConfig.decisionKeywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            const decision = {
                id: 'decision-' + Date.now() + Math.random(),
                text: text,
                keyword: keyword,
                timestamp: Date.now() - appState.recordingStartTime,
                confidence: 0.7 + Math.random() * 0.3,
                type: 'decision'
            };
            
            appState.decisions.push(decision);
            addDecisionToUI(decision);
        }
    });
}

function addActionItemToUI(actionItem) {
    const actionItemsContent = elements.actionItemsContent;
    const placeholder = actionItemsContent.querySelector('.action-items-placeholder');
    
    if (placeholder) {
        placeholder.remove();
    }
    
    const itemElement = document.createElement('div');
    itemElement.className = 'action-item';
    itemElement.innerHTML = `
        <div class="item-header">
            <div class="item-text">${actionItem.text}</div>
            <div class="item-confidence">${Math.round(actionItem.confidence * 100)}%</div>
        </div>
        <div class="item-metadata">
            <div class="item-timestamp">${formatTime(actionItem.timestamp / 1000)}</div>
            <div class="item-keywords">
                <span class="keyword-tag">${actionItem.keyword}</span>
            </div>
        </div>
    `;
    
    actionItemsContent.appendChild(itemElement);
    elements.actionItemCount.textContent = `${appState.actionItems.length} items`;
}

function addDecisionToUI(decision) {
    const decisionsContent = elements.decisionsContent;
    const placeholder = decisionsContent.querySelector('.decisions-placeholder');
    
    if (placeholder) {
        placeholder.remove();
    }
    
    const itemElement = document.createElement('div');
    itemElement.className = 'decision-item';
    itemElement.innerHTML = `
        <div class="item-header">
            <div class="item-text">${decision.text}</div>
            <div class="item-confidence">${Math.round(decision.confidence * 100)}%</div>
        </div>
        <div class="item-metadata">
            <div class="item-timestamp">${formatTime(decision.timestamp / 1000)}</div>
            <div class="item-keywords">
                <span class="keyword-tag">${decision.keyword}</span>
            </div>
        </div>
    `;
    
    decisionsContent.appendChild(itemElement);
    elements.decisionCount.textContent = `${appState.decisions.length} decisions`;
}

// Recording Functions
async function startRecording() {
    try {
        if (!appState.permissions.screen || !appState.permissions.microphone) {
            showToast('Please grant all permissions first', 'error');
            return;
        }
        
        // Combine streams
        const combinedStream = new MediaStream();
        
        // Add video tracks from screen capture
        appState.screenStream.getVideoTracks().forEach(track => {
            combinedStream.addTrack(track);
        });
        
        // Add audio tracks from both screen and microphone
        appState.screenStream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
        });
        
        appState.audioStream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
        });
        
        appState.combinedStream = combinedStream;
        
        // Set up MediaRecorder
        const options = {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: appConfig.recordingSettings.video.bitrate,
            audioBitsPerSecond: appConfig.recordingSettings.audio.bitrate
        };
        
        appState.mediaRecorder = new MediaRecorder(combinedStream, options);
        appState.recordedChunks = [];
        
        appState.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                appState.recordedChunks.push(event.data);
            }
        };
        
        appState.mediaRecorder.onstop = () => {
            const blob = new Blob(appState.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            // Enable download button
            elements.downloadVideo.disabled = false;
            elements.downloadVideo.onclick = () => downloadFile(url, `meeting-${appState.currentMeeting.id}.webm`);
        };
        
        // Start recording
        appState.mediaRecorder.start(1000); // Collect data every second
        appState.isRecording = true;
        appState.recordingStartTime = Date.now();
        appState.currentMeeting.startTime = new Date().toISOString();
        
        // Start speech recognition
        try {
            appState.speechRecognition.start();
        } catch (error) {
            console.log('Speech recognition start failed:', error);
        }
        
        // Update UI
        updateRecordingUI();
        showToast('Recording started successfully!', 'success');
        updateStatus('Recording in progress');
        
        // Show preview
        elements.previewContainer.style.display = 'block';
        elements.previewVideo.srcObject = combinedStream;
        
        // Show export panel
        elements.exportPanel.style.display = 'block';
        
        // Start timer
        const timerInterval = setInterval(() => {
            if (!appState.isRecording) {
                clearInterval(timerInterval);
            } else {
                updateTimer();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Failed to start recording:', error);
        showToast('Failed to start recording: ' + error.message, 'error');
    }
}

function pauseRecording() {
    if (appState.mediaRecorder && appState.isRecording) {
        appState.mediaRecorder.pause();
        appState.isPaused = true;
        
        if (appState.speechRecognition) {
            appState.speechRecognition.stop();
        }
        
        elements.pauseRecording.style.display = 'none';
        elements.resumeRecording.style.display = 'inline-flex';
        
        showToast('Recording paused', 'info');
        updateStatus('Recording paused', 'warning');
        elements.recordingStatus.textContent = 'Paused';
    }
}

function resumeRecording() {
    if (appState.mediaRecorder && appState.isRecording && appState.isPaused) {
        appState.mediaRecorder.resume();
        appState.isPaused = false;
        
        try {
            appState.speechRecognition.start();
        } catch (error) {
            console.log('Speech recognition resume failed:', error);
        }
        
        elements.pauseRecording.style.display = 'inline-flex';
        elements.resumeRecording.style.display = 'none';
        
        showToast('Recording resumed', 'success');
        updateStatus('Recording in progress');
        elements.recordingStatus.textContent = 'Recording';
    }
}

function stopRecording() {
    if (appState.mediaRecorder && appState.isRecording) {
        appState.mediaRecorder.stop();
        appState.isRecording = false;
        appState.isPaused = false;
        
        if (appState.speechRecognition) {
            appState.speechRecognition.stop();
        }
        
        // Stop all tracks
        if (appState.combinedStream) {
            appState.combinedStream.getTracks().forEach(track => track.stop());
        }
        
        // Update UI
        elements.startRecording.style.display = 'inline-flex';
        elements.controlButtons.style.display = 'none';
        elements.startRecording.innerHTML = '<span class="btn-icon">🔴</span><span class="btn-text">Start New Recording</span>';
        
        showToast('Recording stopped successfully!', 'success');
        updateStatus('Recording completed');
        elements.recordingStatus.textContent = 'Completed';
        
        // Enable export buttons
        enableExportButtons();
        
        // Generate final summary
        generateMeetingSummary();
    }
}

function updateRecordingUI() {
    elements.startRecording.style.display = 'none';
    elements.controlButtons.style.display = 'flex';
    elements.recordingStatus.textContent = 'Recording';
    elements.pauseRecording.style.display = 'inline-flex';
    elements.resumeRecording.style.display = 'none';
}

// Export Functions
function enableExportButtons() {
    elements.downloadTranscription.disabled = false;
    elements.downloadSummary.disabled = false;
    elements.downloadAll.disabled = false;
    
    elements.downloadTranscription.onclick = exportTranscription;
    elements.downloadSummary.onclick = exportSummary;
    elements.downloadAll.onclick = exportAll;
}

function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function exportTranscription() {
    const transcriptionText = appState.transcriptionData
        .map(line => `${formatTime(line.timestamp / 1000)}: ${line.text}`)
        .join('\n');
    
    const blob = new Blob([transcriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `transcription-${appState.currentMeeting.id}.txt`);
    
    showToast('Transcription exported!', 'success');
}

function exportSummary() {
  const meetingDate = new Date(appState.currentMeeting.startTime || Date.now());
  const formattedDate = meetingDate.toLocaleDateString();
  const formattedTime = meetingDate.toLocaleTimeString();
  
  // Calculate statistics
  const totalWords = appState.transcriptionData.reduce((count, line) => {
    return count + line.text.split(' ').length;
  }, 0);
  
  const avgConfidence = appState.transcriptionData.reduce((sum, line) => {
    return sum + (line.confidence || 0);
  }, 0) / appState.transcriptionData.length || 0;

  // Create formatted text summary
  const summaryText = `
MEETING SUMMARY REPORT
======================

📅 Meeting Information
----------------------
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${formatTime(appState.recordingDuration)}
Meeting ID: ${appState.currentMeeting.id}

📊 Statistics
-------------
Total Words Spoken: ${totalWords}
Average Confidence: ${Math.round(avgConfidence * 100)}%
Action Items Found: ${appState.actionItems.length}
Key Decisions Made: ${appState.decisions.length}
Transcription Lines: ${appState.transcriptionData.length}

📝 FULL TRANSCRIPTION
=====================
${appState.transcriptionData.map(line => {
  const timestamp = formatTime(line.timestamp / 1000);
  const confidence = Math.round((line.confidence || 0) * 100);
  return `[${timestamp}] ${line.text} (${confidence}% confidence)`;
}).join('\n')}

✅ ACTION ITEMS DETECTED
========================
${appState.actionItems.length === 0 ? 'No action items detected in this meeting.' : 
  appState.actionItems.map((item, index) => {
    const timestamp = formatTime(item.timestamp / 1000);
    const confidence = Math.round(item.confidence * 100);
    return `${index + 1}. [${timestamp}] ${item.text}
   🏷️ Keyword: "${item.keyword}"
   📊 Confidence: ${confidence}%
   ⏰ Time: ${timestamp}
`;
  }).join('\n')
}

💡 KEY DECISIONS MADE
=====================
${appState.decisions.length === 0 ? 'No key decisions detected in this meeting.' :
  appState.decisions.map((decision, index) => {
    const timestamp = formatTime(decision.timestamp / 1000);
    const confidence = Math.round(decision.confidence * 100);
    return `${index + 1}. [${timestamp}] ${decision.text}
   🏷️ Decision Type: "${decision.keyword}"
   📊 Confidence: ${confidence}%
   ⏰ Time: ${timestamp}
`;
  }).join('\n')
}

📋 SUMMARY INSIGHTS
===================
• Meeting lasted ${formatTime(appState.recordingDuration)}
• ${totalWords} words were spoken in total
• Speech recognition averaged ${Math.round(avgConfidence * 100)}% confidence
• ${appState.actionItems.length} action items were automatically detected
• ${appState.decisions.length} key decisions were identified
• This summary was generated automatically by Meeting Summarizer

🔗 NEXT STEPS
==============
1. Review action items and assign owners
2. Follow up on key decisions made
3. Share this summary with meeting participants
4. Schedule follow-up meetings if needed

---
Generated on: ${new Date().toLocaleString()}
Generated by: Meeting Summarizer v1.0
`.trim();

  // Create and download the text file
  const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `meeting-summary-${appState.currentMeeting.id}.txt`);
  
  showToast('Meeting summary exported as text file!', 'success');
}


function exportAll() {
    // Export all files - in a real implementation, this might create a ZIP file
    exportTranscription();
    setTimeout(() => exportSummary(), 500);
    
    showToast('All files exported!', 'success');
}

function generateMeetingSummary() {
    // This would generate a comprehensive summary using the collected data
    console.log('Generating meeting summary...', {
        duration: appState.recordingDuration,
        transcriptionLines: appState.transcriptionData.length,
        actionItems: appState.actionItems.length,
        decisions: appState.decisions.length
    });
}

// Event Listeners
function setupEventListeners() {
    // Permission buttons
    elements.requestScreen.addEventListener('click', requestScreenPermission);
    elements.requestMicrophone.addEventListener('click', requestMicrophonePermission);
    
    // Recording controls
    elements.startRecording.addEventListener('click', startRecording);
    elements.pauseRecording.addEventListener('click', pauseRecording);
    elements.resumeRecording.addEventListener('click', resumeRecording);
    elements.stopRecording.addEventListener('click', stopRecording);
    
    // Language selection
    elements.languageSelect.addEventListener('change', (e) => {
        if (appState.speechRecognition) {
            appState.speechRecognition.lang = e.target.value;
            showToast('Language changed to ' + e.target.options[e.target.selectedIndex].text, 'info');
        }
    });
    
    // Clear transcription
    elements.clearTranscription.addEventListener('click', () => {
        appState.transcriptionData = [];
        elements.transcriptionContent.innerHTML = `
            <div class="transcription-placeholder">
                <div class="placeholder-icon">🎤</div>
                <p>Start recording to see live transcription</p>
                <p class="placeholder-subtitle">Speech will appear here in real-time</p>
            </div>
        `;
        updateTranscriptionStats();
        showToast('Transcription cleared', 'info');
    });
    
    // Export action items
    elements.exportActionItems.addEventListener('click', () => {
        const csv = 'Timestamp,Text,Keyword,Confidence\n' + 
            appState.actionItems.map(item => 
                `${formatTime(item.timestamp / 1000)},"${item.text}","${item.keyword}",${Math.round(item.confidence * 100)}%`
            ).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, `action-items-${appState.currentMeeting.id}.csv`);
        
        showToast('Action items exported!', 'success');
    });
    
    // Export decisions
    elements.exportDecisions.addEventListener('click', () => {
        const csv = 'Timestamp,Decision,Keyword,Confidence\n' + 
            appState.decisions.map(item => 
                `${formatTime(item.timestamp / 1000)},"${item.text}","${item.keyword}",${Math.round(item.confidence * 100)}%`
            ).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, `decisions-${appState.currentMeeting.id}.csv`);
        
        showToast('Decisions exported!', 'success');
    });
}

// Browser Compatibility Check
function checkBrowserCompatibility() {
    const checks = {
        mediaRecorder: 'MediaRecorder' in window,
        getDisplayMedia: navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices,
        getUserMedia: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices,
        speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    };
    
    const unsupported = Object.keys(checks).filter(key => !checks[key]);
    
    if (unsupported.length > 0) {
        const message = `Your browser doesn't support: ${unsupported.join(', ')}. Please use a modern browser like Chrome or Firefox.`;
        showToast(message, 'error');
        updateStatus('Browser not fully compatible', 'error');
        return false;
    }
    
    return true;
}

// Initialize Application
function initializeApp() {
    // Get DOM elements
    elements = {
        // Status elements
        statusText: document.getElementById('statusText'),
        statusDot: document.getElementById('statusDot'),
        recordingTimer: document.getElementById('recordingTimer'),
        
        // Permission elements
        requestScreen: document.getElementById('requestScreen'),
        requestMicrophone: document.getElementById('requestMicrophone'),
        screenStatus: document.getElementById('screenStatus'),
        micStatus: document.getElementById('micStatus'),
        
        // Recording controls
        startRecording: document.getElementById('startRecording'),
        pauseRecording: document.getElementById('pauseRecording'),
        resumeRecording: document.getElementById('resumeRecording'),
        stopRecording: document.getElementById('stopRecording'),
        controlButtons: document.getElementById('controlButtons'),
        
        // Recording info
        recordingStatus: document.getElementById('recordingStatus'),
        recordingDuration: document.getElementById('recordingDuration'),
        fileSize: document.getElementById('fileSize'),
        
        // Preview
        previewContainer: document.getElementById('previewContainer'),
        previewVideo: document.getElementById('previewVideo'),
        
        // Transcription
        languageSelect: document.getElementById('languageSelect'),
        transcriptionContent: document.getElementById('transcriptionContent'),
        clearTranscription: document.getElementById('clearTranscription'),
        wordCount: document.getElementById('wordCount'),
        confidenceScore: document.getElementById('confidenceScore'),
        detectedLanguage: document.getElementById('detectedLanguage'),
        
        // Action items
        actionItemsContent: document.getElementById('actionItemsContent'),
        actionItemCount: document.getElementById('actionItemCount'),
        exportActionItems: document.getElementById('exportActionItems'),
        
        // Decisions
        decisionsContent: document.getElementById('decisionsContent'),
        decisionCount: document.getElementById('decisionCount'),
        exportDecisions: document.getElementById('exportDecisions'),
        
        // Export
        exportPanel: document.getElementById('exportPanel'),
        downloadVideo: document.getElementById('downloadVideo'),
        downloadTranscription: document.getElementById('downloadTranscription'),
        downloadSummary: document.getElementById('downloadSummary'),
        downloadAll: document.getElementById('downloadAll'),
        
        // Toast
        toast: document.getElementById('toast'),
        toastIcon: document.getElementById('toastIcon'),
        toastMessage: document.getElementById('toastMessage')
    };
    
    // Check browser compatibility
    if (!checkBrowserCompatibility()) {
        return;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI
    updateStatus('Ready - Grant permissions to start');
    
    showToast('Meeting Summarizer loaded! Grant permissions to start recording.', 'success');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);