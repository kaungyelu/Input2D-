    // Get DOM elements
        const activeTimeDisplay = document.getElementById('activeTimeDisplay');
        const slipList = document.getElementById('slipList');
        const listCount = document.getElementById('listCount');
        const grandTotal = document.getElementById('grandTotal');
        
        // Current key for localStorage
        let currentKey = '';
        let currentData = [];
        
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
        
        // Function to load saved bets
        function loadSavedBets() {
            const params = getUrlParams();
            
            // Get current time from URL parameters
            if (params.date && params.time) {
                currentKey = `${params.date} ${params.time}`;
                activeTimeDisplay.textContent = currentKey;
            } else {
                // Try to get from localStorage
                const storedDate = localStorage.getItem('selectedDate');
                const storedTime = localStorage.getItem('selectedTime');
                if (storedDate && storedTime) {
                    currentKey = `${storedDate} ${storedTime}`;
                    activeTimeDisplay.textContent = currentKey;
                } else {
                    activeTimeDisplay.textContent = 'No Active Time';
                    return;
                }
            }
            
            // Get data from localStorage
            const savedData = JSON.parse(localStorage.getItem(currentKey));
            if (!savedData || savedData.length === 0) {
                slipList.innerHTML = '<div class="empty-message">လောင်းကြေးမရှိသေးပါ</div>';
                listCount.textContent = '0';
                grandTotal.textContent = '0';
                currentData = [];
                return;
            }
            
            currentData = savedData;
            // Display saved bets
            displaySlips(savedData);
        }
        
        // Function to format number with leading zero
        function formatNumber(num) {
            if (num === undefined || num === null) return '';
            const numStr = num.toString();
            return numStr.length === 1 ? '0' + numStr : numStr;
        }
        
        // Function to format date in English
        function formatEnglishDate(dateString) {
            try {
                const date = new Date(dateString);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const seconds = date.getSeconds().toString().padStart(2, '0');
                
                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            } catch (e) {
                return new Date().toLocaleString();
            }
        }
        
        // Function to display slips
        function displaySlips(slipsData) {
            slipList.innerHTML = '';
            let totalGrandTotal = 0;
            
            // Reverse the array to show latest first
            const reversedData = [...slipsData].reverse();
            
            reversedData.forEach((slip, index) => {
                const slipItem = document.createElement('div');
                slipItem.className = 'slip-item';
                const originalIndex = slipsData.length - index - 1;
                slipItem.dataset.index = originalIndex;
                
                const slipNumber = slipsData.length - index;
                const slipDate = formatEnglishDate(slip.timestamp || new Date().toISOString());
                
                let betRows = '';
                if (slip.items && slip.items.length > 0) {
                    slip.items.forEach(item => {
                        const displayNum = formatNumber(item.display || item.num || item.number);
                        const amount = item.amount;
                        
                        betRows += `
                            <div class="bet-row">
                                <div class="bet-number">${displayNum}</div>
                                <div class="bet-amount">${amount.toLocaleString()}</div>
                            </div>
                        `;
                    });
                }
                
                slipItem.innerHTML = `
                    <div class="slip-header">
                        <div class="slip-number">${slipNumber}</div>
                        <div class="slip-date">${slipDate}</div>
                    </div>
                    <div class="slip-content">
                        ${betRows}
                        <div class="slip-total">
                            Total: ${slip.total.toLocaleString()}
                        </div>
                        <div class="item-actions">
                            <button class="edit-btn" onclick="editSlip(${originalIndex})">Edit</button>
                            <button class="delete-btn" onclick="deleteSlip(${originalIndex})">Delete</button>
                        </div>
                    </div>
                `;
                
                slipList.appendChild(slipItem);
                totalGrandTotal += slip.total;
            });
            
            // Update counters
            listCount.textContent = slipsData.length;
            grandTotal.textContent = totalGrandTotal.toLocaleString();
        }
        
        // Function to create edit modal
        function showEditModal(index) {
            const slip = currentData[index];
            if (!slip) return;
            
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            // Create text for editing - format: "21 500\n12 1000"
            let editText = '';
            if (slip.items && slip.items.length > 0) {
                editText = slip.items.map(item => {
                    const num = formatNumber(item.display || item.num || item.number);
                    return `${num} ${item.amount}`;
                }).join('\n');
            }
            
            // Create modal content
            overlay.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">Edit Slip #${index + 1}</div>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    <textarea class="edit-textarea" placeholder="Enter number and amount on each line:\n21 500\n12 1000\n\nExample format:\n00 1000\n01 2000\n02 3000">${editText}</textarea>
                    <div class="modal-buttons">
                        <button class="save-btn" onclick="saveEditedSlip(${index})">Save</button>
                        <button class="cancel-btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Close on overlay click
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
            
            // Focus on textarea
            setTimeout(() => {
                const textarea = overlay.querySelector('.edit-textarea');
                if (textarea) {
                    textarea.focus();
                    textarea.select();
                }
            }, 100);
        }
        
        // Function to edit slip
        function editSlip(index) {
            showEditModal(index);
        }
        
        // Function to save edited slip
        function saveEditedSlip(index) {
            const modal = document.querySelector('.modal-overlay');
            const textarea = modal.querySelector('.edit-textarea');
            const editText = textarea.value.trim();
            
            if (!editText) {
                alert('Please enter slip data');
                return;
            }
            
            // Parse the edited text
            const lines = editText.split('\n').filter(line => line.trim());
            const items = [];
            let total = 0;
            
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                    const numStr = parts[0];
                    const amountStr = parts[1];
                    
                    const num = parseInt(numStr);
                    const amount = parseInt(amountStr.replace(/,/g, ''));
                    
                    if (!isNaN(num) && !isNaN(amount) && amount >= 0) {
                        items.push({
                            display: formatNumber(num),
                            num: num,
                            number: num,
                            amount: amount
                        });
                        total += amount;
                    }
                }
            }
            
            if (items.length === 0) {
                alert('Invalid data format. Please use: "number amount" on each line');
                return;
            }
            
            // Update the slip
            currentData[index] = {
                ...currentData[index],
                items: items,
                total: total,
                timestamp: new Date().toISOString() // Update timestamp
            };
            
            // Save to localStorage
            localStorage.setItem(currentKey, JSON.stringify(currentData));
            
            // Remove modal
            modal.remove();
            
            // Reload the list
            loadSavedBets();
            
            alert('Slip updated successfully!');
        }
        
        // Function to delete slip
        function deleteSlip(index) {
            if (!confirm('Are you sure you want to delete this slip?')) {
                return;
            }
            
            // Remove the slip
            currentData.splice(index, 1);
            
            // Save updated data
            localStorage.setItem(currentKey, JSON.stringify(currentData));
            
            // Reload the list
            loadSavedBets();
            
            alert('Slip deleted successfully!');
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', loadSavedBets);
        
        // Auto-refresh every 30 seconds
        setInterval(loadSavedBets, 30000);
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Go back to main.html
                const params = getUrlParams();
                if (params.date && params.time) {
                    window.location.href = `main.html?date=${encodeURIComponent(params.date)}&time=${encodeURIComponent(params.time)}`;
                } else {
                    window.location.href = "main.html";
                }
            } else if (e.key === 'F5') {
                e.preventDefault();
                loadSavedBets();
            }
        });
    
