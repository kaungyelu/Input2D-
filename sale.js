
        // Function to get URL parameters
        function getUrlParams() {
            const params = {};
            const queryString = window.location.search.substring(1);
            const pairs = queryString.split('&');
            
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i].split('=');
                if (pair[0]) {
                    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
                }
            }
            return params;
        }
        
        // On page load
        document.addEventListener('DOMContentLoaded', function() {
            const params = getUrlParams();
            const activeTimeDisplay = document.getElementById('activeTimeDisplay');
            
            // Check if date and time parameters exist
            if (params.date && params.time) {
                // Display the active time
                activeTimeDisplay.textContent = `${params.date} ${params.time}`;
                
                // Store the selected time in localStorage
                localStorage.setItem('selectedDate', params.date);
                localStorage.setItem('selectedTime', params.time);
            } else {
                // Check localStorage for stored time data
                const storedDate = localStorage.getItem('selectedDate');
                const storedTime = localStorage.getItem('selectedTime');
                
                if (storedDate && storedTime) {
                    // Display stored time data
                    activeTimeDisplay.textContent = `${storedDate} ${storedTime}`;
                } else {
                    // No time data available
                    activeTimeDisplay.textContent = 'Time not selected';
                }
            }
            
            // Your existing bet system code continues here...
            // (The existing bet system JavaScript code would go here)
        });
    
