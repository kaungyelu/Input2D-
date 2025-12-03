// a4Btn အတွက် event listener ထပ်ထည့်မယ်
const a4Btn = document.getElementById('a4Btn');
a4Btn.addEventListener('click', processAndAddBets);

// Function to check if line contains wheel or dynamic system
function containsWheelOrDynamicSystem(line) {
    const wheelKeywords = ['ခွေ', 'ခွေပူး'];
    const dynamicKeywords = ['ထိပ်', 'ပိတ်', 'ပါ', 'ဘရိတ်'];
    
    for (const keyword of wheelKeywords) {
        if (line.includes(keyword)) {
            return true;
        }
    }
    
    for (const keyword of dynamicKeywords) {
        if (line.includes(keyword)) {
            return true;
        }
    }
    
    return false;
}

// Function to process text and combine numbers with same amount
function processAndAddBets() {
    const inputText = betInput.value.trim();
    if (!inputText) {
        alert('လောင်းကြေးထည့်ပါ');
        return;
    }

    const lines = inputText.split('\n');
    const betEntries = []; // Store all bet entries
    const remainingLines = []; // Store lines that contain wheel or dynamic system
    let lastRegularAmount = null;
    let lastReverseAmount = null;
    let lastAmountIsReverse = false;
    
    // Store original text for cancellation
    const originalText = betInput.value;
    
    for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (!trimmedLine) continue;

        let normalizedLine = normalizeAllSpecialText(trimmedLine);
        normalizedLine = normalizeReverseText(normalizedLine);
        
        // Check if line contains wheel or dynamic system
        if (containsWheelOrDynamicSystem(normalizedLine)) {
            remainingLines.push(trimmedLine); // Keep original line (not normalized)
            continue; // Skip processing this line
        }
        
        // Case 1: Special cases (အပူး, ပါဝါ, နက္ခ, ညီကို, ကိုညီ)
        for (const [caseName, caseNumbers] of Object.entries(specialCases)) {
            if (normalizedLine.includes(caseName)) {
                const amountStr = normalizedLine.replace(caseName, '').replace(/\D/g, '');
                const amount = parseInt(amountStr);
                
                if (amount && amount >= 100) {
                    // Store amounts for future numbers
                    lastRegularAmount = amount;
                    lastReverseAmount = null;
                    lastAmountIsReverse = false;
                    
                    // Add all special numbers
                    caseNumbers.forEach(num => {
                        betEntries.push({ number: num, amount: amount, type: caseName });
                    });
                    continue;
                }
            }
        }
        
        // Case 2: Even/Odd system (စုံစုံ, မမ, စုံမ, မစုံ)
        for (const [caseName, caseType] of Object.entries(evenOddCases)) {
            if (normalizedLine.includes(caseName)) {
                const amountStr = normalizedLine.replace(caseName, '').replace(/\D/g, '');
                const amount = parseInt(amountStr);
                
                if (amount && amount >= 100) {
                    // Store amounts for future numbers
                    lastRegularAmount = amount;
                    lastReverseAmount = null;
                    lastAmountIsReverse = false;
                    
                    // Generate numbers for Even/Odd system
                    const numbers = generateEvenOddNumbers(caseType, normalizedLine.includes('r'));
                    numbers.forEach(num => {
                        betEntries.push({ number: num, amount: amount, type: caseName });
                    });
                    continue;
                }
            }
        }
        
        // Case 3: Single digit with Even/Odd (1စုံ, 2မ)
        const singleEvenOddMatch = normalizedLine.match(/^(\d)(စုံ|မ)r?(\d+)$/);
        if (singleEvenOddMatch) {
            const [, digitStr, evenOddType, amountStr] = singleEvenOddMatch;
            const digit = parseInt(digitStr);
            const amount = parseInt(amountStr);
            const includeReverse = normalizedLine.includes('r');
            
            if (amount >= 100) {
                // Store amounts for future numbers
                lastRegularAmount = amount;
                lastReverseAmount = includeReverse ? amount : null;
                lastAmountIsReverse = includeReverse;
                
                const numbers = [];
                if (evenOddType === 'စုံ') {
                    for (const evenDigit of evenDigits) {
                        numbers.push(digit * 10 + evenDigit);
                        if (includeReverse) {
                            numbers.push(evenDigit * 10 + digit);
                        }
                    }
                } else {
                    for (const oddDigit of oddDigits) {
                        numbers.push(digit * 10 + oddDigit);
                        if (includeReverse) {
                            numbers.push(oddDigit * 10 + digit);
                        }
                    }
                }
                
                const uniqueNumbers = [...new Set(numbers)];
                uniqueNumbers.forEach(num => {
                    betEntries.push({ 
                        number: num, 
                        amount: amount, 
                        type: digit + evenOddType + (includeReverse ? ' R' : '') 
                    });
                });
                continue;
            }
        }
        
        // Case 4: Reverse pattern with two amounts (12-1000r500)
        const reverseTwoAmountMatch = normalizedLine.match(/^(\d{1,2})[\-\s\.]*(\d+)\s*r\s*(\d+)$/);
        if (reverseTwoAmountMatch) {
            const [, numStr, amount1Str, amount2Str] = reverseTwoAmountMatch;
            const num = parseInt(numStr);
            const amount1 = parseInt(amount1Str);
            const amount2 = parseInt(amount2Str);
            
            if (num >= 0 && num <= 99 && amount1 >= 100 && amount2 >= 100) {
                const revNum = reverseNumber(num);
                
                // Store amounts for future numbers
                lastRegularAmount = amount1;
                lastReverseAmount = amount2;
                lastAmountIsReverse = true;
                
                // Add both entries
                betEntries.push({ number: num, amount: amount1, type: 'Reverse' });
                betEntries.push({ number: revNum, amount: amount2, type: 'Reverse' });
                continue;
            }
        }
        
        // Case 5: Simple reverse pattern (78r1000)
        const simpleReverseMatch = normalizedLine.match(/^(\d{1,2})\s*r\s*(\d+)$/);
        if (simpleReverseMatch) {
            const [, numStr, amountStr] = simpleReverseMatch;
            const num = parseInt(numStr);
            const amount = parseInt(amountStr);
            
            if (num >= 0 && num <= 99 && amount >= 100) {
                const revNum = reverseNumber(num);
                
                // Store amounts for future numbers
                lastRegularAmount = amount;
                lastReverseAmount = amount;
                lastAmountIsReverse = true;
                
                // Add both entries with same amount
                betEntries.push({ number: num, amount: amount, type: 'Reverse' });
                betEntries.push({ number: revNum, amount: amount, type: 'Reverse' });
                continue;
            }
        }
        
        // Case 6: Regular number-amount pattern (90-100)
        const regularMatch = normalizedLine.match(/^(\d{1,2})[\-\s\.]*(\d+)$/);
        if (regularMatch && !normalizedLine.includes('r')) {
            const [, numStr, amountStr] = regularMatch;
            const num = parseInt(numStr);
            const amount = parseInt(amountStr);
            
            if (num >= 0 && num <= 99 && amount >= 100) {
                // Store amount for future numbers
                lastRegularAmount = amount;
                lastReverseAmount = null;
                lastAmountIsReverse = false;
                
                // Add entry
                betEntries.push({ number: num, amount: amount, type: 'Regular' });
                continue;
            }
        }
        
        // Case 7: Group numbers with amount (12/34/56-1000)
        const groupMatch = normalizedLine.match(/^([\d\/\.\-\s]+?)[\-\s\.]+(\d+)$/);
        if (groupMatch && !normalizedLine.includes('r')) {
            const [, numbersPart, amountStr] = groupMatch;
            const amount = parseInt(amountStr);
            
            if (amount >= 100) {
                // Store amount for future numbers
                lastRegularAmount = amount;
                lastReverseAmount = null;
                lastAmountIsReverse = false;
                
                // Extract all numbers
                const numbers = [];
                const numberStrings = numbersPart.split(/[\/\-\*\.\s]+/);
                
                numberStrings.forEach(str => {
                    const numStr = str.replace(/\D/g, '');
                    if (numStr.length === 1 || numStr.length === 2) {
                        const num = parseInt(numStr);
                        if (num >= 0 && num <= 99 && !isNaN(num)) {
                            numbers.push(num);
                        }
                    }
                });
                
                if (numbers.length > 0) {
                    numbers.forEach(num => {
                        betEntries.push({ number: num, amount: amount, type: 'Group' });
                    });
                    continue;
                }
            }
        }
        
        // Case 8: Simple number only (34, 56, 45, 23)
        const simpleNumberMatch = trimmedLine.match(/^(\d{1,2})$/);
        if (simpleNumberMatch) {
            const num = parseInt(simpleNumberMatch[1]);
            
            if (num >= 0 && num <= 99) {
                if (lastRegularAmount !== null) {
                    // Add regular number
                    betEntries.push({ 
                        number: num, 
                        amount: lastRegularAmount, 
                        type: 'Follow Regular' 
                    });
                    
                    // If last was reverse pattern, also add reverse number
                    if (lastAmountIsReverse && lastReverseAmount !== null) {
                        const revNum = reverseNumber(num);
                        betEntries.push({ 
                            number: revNum, 
                            amount: lastReverseAmount, 
                            type: 'Follow Reverse' 
                        });
                    }
                } else {
                    // If no previous amount, keep the line
                    remainingLines.push(trimmedLine);
                }
                continue;
            }
        }
        
        // Case 9: If none of the above, try to parse anyway
        const fallbackMatch = trimmedLine.match(/(\d+)/g);
        if (fallbackMatch && fallbackMatch.length >= 1) {
            const num = parseInt(fallbackMatch[0]);
            if (num >= 0 && num <= 99) {
                if (fallbackMatch.length >= 2) {
                    const amount = parseInt(fallbackMatch[1]);
                    if (amount >= 100) {
                        lastRegularAmount = amount;
                        lastReverseAmount = null;
                        lastAmountIsReverse = false;
                        betEntries.push({ 
                            number: num, 
                            amount: amount, 
                            type: 'Fallback' 
                        });
                    }
                } else if (lastRegularAmount !== null) {
                    betEntries.push({ 
                        number: num, 
                        amount: lastRegularAmount, 
                        type: 'Follow Fallback' 
                    });
                    if (lastAmountIsReverse && lastReverseAmount !== null) {
                        const revNum = reverseNumber(num);
                        betEntries.push({ 
                            number: revNum, 
                            amount: lastReverseAmount, 
                            type: 'Follow Reverse Fallback' 
                        });
                    }
                } else {
                    // If no previous amount, keep the line
                    remainingLines.push(trimmedLine);
                }
                continue;
            }
        }
        
        // Case 10: If no pattern matched, keep the original line
        remainingLines.push(trimmedLine);
    }
    
    // Process the collected bets
    if (betEntries.length > 0) {
        // Format output as requested
        const formattedOutput = betEntries.map(entry => 
            `${entry.number.toString().padStart(2, '0')}-${entry.amount}`
        ).join('/');
        
        // Combine formatted bets with remaining lines
        let finalText = formattedOutput;
        if (remainingLines.length > 0) {
            if (formattedOutput) {
                finalText += '\n' + remainingLines.join('\n');
            } else {
                finalText = remainingLines.join('\n');
            }
        }
        
        // Show preview and ask for confirmation
        const totalAmountProcessed = betEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const confirmMsg = `လောင်းကြေးအရေအတွက်: ${betEntries.length}\nစုစုပေါင်းငွေ: ${totalAmountProcessed.toLocaleString()}\n\nအောက်ပါအတိုင်း format လုပ်ထားပါတယ်:\n${formattedOutput}\n\nခွေ/ထိပ်/ပိတ်/ဘရိတ်/ပါစနစ်များedittext တွင်ကျန်ရှိမည်။Add2နိုပ်ပါ\n\nလောင်းကြေးစာရင်းထဲထည့်မလား?`;
        
        if (confirm(confirmMsg)) {
            // Convert to bet objects and add to main list
            const processedBets = betEntries.map(entry => ({
                number: entry.number,
                amount: entry.amount,
                display: entry.number.toString().padStart(2, '0'),
                type: entry.type || 'A4 Processed'
            }));
            
            bets.push(...processedBets);
            processedBets.forEach(bet => {
                totalAmount += bet.amount;
            });
            
            updateDisplay();
            
            // Update input field with remaining lines
            betInput.value = remainingLines.join('\n');
            
            // Auto scroll to bottom
            setTimeout(() => {
                const listView = document.querySelector('.list-view');
                listView.scrollTop = listView.scrollHeight;
            }, 100);
        } else {
            // Cancel နှိပ်ရင် original text ကို ပြန်ထည့်
            betInput.value = originalText;
        }
    } else if (remainingLines.length > 0) {
        // Only wheel/dynamic systems found
        alert('ခွေ/ခွေပူး/ထိပ်/ပိတ်/ဘရိတ်စနစ်များကို တွေ့ရှိပါသည်။\nဤစနစ်များကို Add1 စနစ်ဖြင့် မထည့်သွင်းပါ။Add2နိုပ်ပါ\nEdittext တွင်ကျန်ရှိနေပါမည်။');
        
        // Keep the original text (wheel/dynamic systems) in the input field
        betInput.value = remainingLines.join('\n');
    } else {
        alert('လောင်းကြေးအသစ် မရှိပါ။');
    }
}
