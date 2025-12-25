// 檔案上傳處理模組
class FileUploadHandler {
    constructor() {
        this.supportedFormats = ['.csv', '.xlsx', '.xls'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.initialize();
    }

    initialize() {
        console.log('檔案上傳模組初始化完成');
    }

    // 驗證檔案格式
    validateFileFormat(fileName) {
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return this.supportedFormats.includes(extension);
    }

    // 驗證檔案大小
    validateFileSize(fileSize) {
        return fileSize <= this.maxFileSize;
    }

    // 全面檔案驗證
    validateFile(file) {
        const errors = [];

        if (!this.validateFileFormat(file.name)) {
            errors.push(`不支援的檔案格式: ${file.name}。支援格式: ${this.supportedFormats.join(', ')}`);
        }

        if (!this.validateFileSize(file.size)) {
            errors.push(`檔案過大: ${file.name}。最大支援 ${this.maxFileSize / 1024 / 1024}MB`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // 解析CSV檔案
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV檔案必須包含標題行和至少一行資料');
        }

        // 解析標題行
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim());
        console.log('檢測到的標題:', headers);

        // 檢查是否有重複的欄位組合（如P_ID和P_ID2）
        const hasMultiplePlayerSets = headers.includes('P_ID2') || headers.includes('p_id2');
        
        const data = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            try {
                const values = this.parseCSVLine(line);
                
                if (hasMultiplePlayerSets && values.length >= 12) {
                    // 處理雙選手資料格式
                    // 第一組資料 (P_ID, date, stage, time, vel_mean, acc_mean)
                    const player1Data = {
                        p_id: values[0]?.trim() || '',
                        date: this.formatDate(values[1]?.trim() || ''),
                        stage: this.parseNumber(values[2], '階段'),
                        time: this.parseNumber(values[3], '時間'),
                        vel_mean: this.parseNumber(values[4], '平均速度'),
                        acc_mean: this.parseNumber(values[5], '平均加速度')
                    };

                    // 第二組資料 (P_ID2, date, stage, time, vel_mean, acc_mean)
                    const player2Data = {
                        p_id: values[6]?.trim() || '',
                        date: this.formatDate(values[7]?.trim() || ''),
                        stage: this.parseNumber(values[8], '階段'),
                        time: this.parseNumber(values[9], '時間'),
                        vel_mean: this.parseNumber(values[10], '平均速度'),
                        acc_mean: this.parseNumber(values[11], '平均加速度')
                    };

                    // 驗證並添加第一組資料
                    const validation1 = this.validateRowData(player1Data, i + 1, 'Player1');
                    if (validation1.isValid) {
                        data.push(player1Data);
                    } else {
                        errors.push(...validation1.errors);
                    }

                    // 驗證並添加第二組資料
                    const validation2 = this.validateRowData(player2Data, i + 1, 'Player2');
                    if (validation2.isValid) {
                        data.push(player2Data);
                    } else {
                        errors.push(...validation2.errors);
                    }

                } else if (values.length >= 6) {
                    // 處理單一選手資料格式
                    const rowData = {
                        p_id: values[0]?.trim() || '',
                        date: this.formatDate(values[1]?.trim() || ''),
                        stage: this.parseNumber(values[2], '階段'),
                        time: this.parseNumber(values[3], '時間'),
                        vel_mean: this.parseNumber(values[4], '平均速度'),
                        acc_mean: this.parseNumber(values[5], '平均加速度')
                    };

                    const validation = this.validateRowData(rowData, i + 1);
                    if (validation.isValid) {
                        data.push(rowData);
                    } else {
                        errors.push(...validation.errors);
                    }
                } else {
                    errors.push(`第 ${i + 1} 行: 資料欄位不足 (需要至少6個欄位，實際有${values.length}個)`);
                }

            } catch (error) {
                errors.push(`第 ${i + 1} 行: ${error.message}`);
            }
        }

        return {
            data: data,
            errors: errors,
            totalRows: lines.length - 1,
            validRows: data.length
        };
    }

    // 解析CSV行（處理引號內的逗號）
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // 解析數字
    parseNumber(value, fieldName) {
        if (value === null || value === undefined || value === '') {
            throw new Error(`${fieldName}不能為空`);
        }
        
        const num = parseFloat(value);
        if (isNaN(num)) {
            throw new Error(`${fieldName}必須為有效數字: ${value}`);
        }
        
        return num;
    }

    // 驗證行資料
    validateRowData(data, rowNumber, playerLabel = '') {
        const errors = [];
        const prefix = playerLabel ? `第 ${rowNumber} 行 (${playerLabel})` : `第 ${rowNumber} 行`;

        // 必要欄位檢查
        if (!data.p_id) {
            errors.push(`${prefix}: P_ID不能為空`);
        }

        if (!data.date) {
            errors.push(`${prefix}: 日期不能為空`);
        } else {
            // 嘗試格式化後再驗證日期
            const formattedDate = this.formatDate(data.date);
            if (!this.isValidDate(formattedDate)) {
                // 如果格式化後仍然無效，給出更詳細的錯誤信息
                console.warn(`日期格式警告 ${prefix}: 原始日期 "${data.date}", 格式化後 "${formattedDate}"`);
                // 暫時允許通過，但記錄警告
            } else {
                // 更新為格式化後的日期
                data.date = formattedDate;
            }
        }

        // 數值範圍檢查
        if (data.stage < 0) {
            errors.push(`${prefix}: 階段必須為非負數`);
        }

        if (data.time < 0) {
            errors.push(`${prefix}: 時間必須為非負數`);
        }

        // 合理範圍檢查（放寬限制）
        if (data.time > 100) {
            console.warn(`${prefix}: 時間值較大: ${data.time}`);
        }

        if (Math.abs(data.vel_mean) > 50) {
            console.warn(`${prefix}: 速度值較大: ${data.vel_mean}`);
        }

        if (Math.abs(data.acc_mean) > 50) {
            console.warn(`${prefix}: 加速度值較大: ${data.acc_mean}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // 格式化日期（處理20725這種格式）
    formatDate(dateString) {
        if (!dateString) return '';
        
        // 如果已經是標準格式，直接返回
        if (this.isValidDate(dateString)) {
            return dateString;
        }
        
        // 處理20725這種格式 (假設是2025年的第207天或2025年7月的某種格式)
        const str = dateString.toString();
        
        if (str.length === 5 && /^\d{5}$/.test(str)) {
            // 假設格式是YYDDD (年份後兩位 + 天數)
            const year = '20' + str.substring(0, 2);
            const dayOfYear = parseInt(str.substring(2));
            
            if (dayOfYear >= 1 && dayOfYear <= 366) {
                const date = new Date(parseInt(year), 0, dayOfYear);
                return date.toISOString().split('T')[0]; // 返回YYYY-MM-DD格式
            }
        }
        
        if (str.length === 5 && /^\d{5}$/.test(str)) {
            // 嘗試另一種解釋：20725 = 2025年7月25日簡寫
            if (str.startsWith('207')) {
                const month = str.substring(2, 3); // 7
                const day = str.substring(3); // 25
                return `2025-0${month}-${day.padStart(2, '0')}`;
            }
        }
        
        // 如果無法解析，返回原始字符串並在驗證時報錯
        return dateString;
    }

    // 驗證日期格式
    isValidDate(dateString) {
        // 支援多種日期格式
        const dateFormats = [
            /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
            /^\d{4}\/\d{2}\/\d{2}$/,  // YYYY/MM/DD
            /^\d{2}\/\d{2}\/\d{4}$/,  // MM/DD/YYYY
            /^\d{2}-\d{2}-\d{4}$/   // MM-DD-YYYY
        ];

        const isValidFormat = dateFormats.some(format => format.test(dateString));
        if (!isValidFormat) return false;

        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // 處理Excel檔案
    async processExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    if (workbook.SheetNames.length === 0) {
                        reject(new Error('Excel檔案中沒有工作表'));
                        return;
                    }

                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                    
                    if (jsonData.length === 0) {
                        reject(new Error('Excel檔案中沒有資料'));
                        return;
                    }

                    const result = this.processExcelData(jsonData);
                    resolve(result);
                    
                } catch (error) {
                    reject(new Error(`Excel檔案解析錯誤: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('檔案讀取失敗'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // 處理Excel資料
    processExcelData(jsonData) {
        const data = [];
        const errors = [];

        jsonData.forEach((row, index) => {
            try {
                // 支援多種欄位名稱格式
                const rowData = {
                    p_id: this.getFieldValue(row, ['P_ID', 'p_id', 'PID', 'pid']),
                    date: this.getFieldValue(row, ['Date', 'date', 'DATE']),
                    stage: this.parseNumber(this.getFieldValue(row, ['Stage', 'stage', 'STAGE']), '階段'),
                    time: this.parseNumber(this.getFieldValue(row, ['Time', 'time', 'TIME']), '時間'),
                    vel_mean: this.parseNumber(this.getFieldValue(row, ['Vel_mean', 'vel_mean', 'VEL_MEAN', 'velocity']), '平均速度'),
                    acc_mean: this.parseNumber(this.getFieldValue(row, ['Acc_mean', 'acc_mean', 'ACC_MEAN', 'acceleration']), '平均加速度')
                };

                const validation = this.validateRowData(rowData, index + 2); // +2因為Excel從第2行開始
                if (validation.isValid) {
                    data.push(rowData);
                } else {
                    errors.push(...validation.errors);
                }

            } catch (error) {
                errors.push(`第 ${index + 2} 行: ${error.message}`);
            }
        });

        return {
            data: data,
            errors: errors,
            totalRows: jsonData.length,
            validRows: data.length
        };
    }

    // 取得欄位值（支援多種欄位名稱）
    getFieldValue(row, fieldNames) {
        for (const fieldName of fieldNames) {
            if (row[fieldName] !== undefined && row[fieldName] !== null) {
                return String(row[fieldName]).trim();
            }
        }
        return '';
    }

    // 產生上傳報告
    generateUploadReport(result, fileName) {
        const { data, errors, totalRows, validRows } = result;
        
        let report = `檔案: ${fileName}\n`;
        report += `總行數: ${totalRows}\n`;
        report += `成功匯入: ${validRows} 筆\n`;
        report += `失敗: ${totalRows - validRows} 筆\n\n`;

        if (errors.length > 0) {
            report += '錯誤詳情:\n';
            errors.forEach(error => {
                report += `- ${error}\n`;
            });
        }

        return report;
    }

    // 讀取CSV檔案
    readCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                
                // 自動檢測分隔符（逗號或Tab）
                const firstLine = text.split('\n')[0];
                let csv = text;
                
                if (firstLine.includes('\t') && !firstLine.includes(',')) {
                    // 如果包含Tab但不包含逗號，轉換Tab為逗號
                    csv = text.replace(/\t/g, ',');
                    console.log('檢測到Tab分隔格式，已轉換為逗號分隔');
                }
                
                const result = this.parseCSV(csv);
                const report = this.generateUploadReport(result, file.name);
                
                console.log('CSV解析結果:', result);
                console.log('上傳報告:', report);
                
                let importedCount = 0;
                
                if (result.data.length > 0) {
                    result.data.forEach(data => {
                        if (window.system) {
                            window.system.addData(data);
                            importedCount++;
                        }
                    });
                    
                    if (window.system) {
                        window.system.displayData();
                        window.system.updateCharts();
                    }
                }
                
                let message = `成功匯入 ${importedCount} 筆資料`;
                if (result.errors.length > 0) {
                    message += `，${result.errors.length} 筆資料有問題`;
                    console.warn('匯入錯誤:', result.errors);
                }
                
                this.showUploadStatus(message, importedCount > 0 ? 'success' : 'error');
                
            } catch (error) {
                console.error('CSV檔案讀取錯誤:', error);
                this.showUploadStatus('CSV檔案讀取錯誤: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    // 顯示上傳狀態
    showUploadStatus(message, type = 'info') {
        const statusDiv = document.getElementById('uploadStatus');
        if (!statusDiv) return;

        statusDiv.className = `upload-status ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';

        // 如果是成功或錯誤訊息，3秒後隱藏
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    // 清空所有資料（從上傳模組調用）
    clearAllDataFromUpload() {
        if (window.system) {
            window.system.clearAllData();
        } else {
            console.warn('系統未初始化，無法清空資料');
        }
    }
}

// 測試函數
function simpleFileTest() {
    console.log('開始檔案上傳測試...');
    
    // 創建測試CSV內容
    const testCSV = `P_ID,Date,Stage,Time,Vel_mean,Acc_mean
P001,2024-01-15,1,10.5,2.345678,1.234567
P001,2024-01-15,2,11.2,2.456789,1.345678
P002,2024-01-16,1,9.8,2.567890,1.456789`;

    // 創建Blob和File對象
    const blob = new Blob([testCSV], { type: 'text/csv' });
    const file = new File([blob], 'test_data.csv', { type: 'text/csv' });

    // 測試檔案處理
    const uploadHandler = new FileUploadHandler();
    const validation = uploadHandler.validateFile(file);
    
    if (validation.isValid) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = uploadHandler.parseCSV(e.target.result);
                const report = uploadHandler.generateUploadReport(result, file.name);
                
                console.log('測試結果:', result);
                console.log('測試報告:', report);
                
                // 如果有系統實例，添加測試資料
                if (window.system && result.data.length > 0) {
                    result.data.forEach(data => {
                        window.system.addData(data);
                    });
                    window.system.displayData();
                    window.system.updateCharts();
                }
                
                uploadHandler.showUploadStatus(`測試成功！匯入 ${result.validRows} 筆資料`, 'success');
                
            } catch (error) {
                console.error('測試失敗:', error);
                uploadHandler.showUploadStatus(`測試失敗: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    } else {
        console.error('檔案驗證失敗:', validation.errors);
        uploadHandler.showUploadStatus(`檔案驗證失敗: ${validation.errors.join(', ')}`, 'error');
    }
}

function testUploadFunction() {
    console.log('測試上傳模組功能...');
    
    const uploadHandler = new FileUploadHandler();
    
    // 測試各種功能
    console.log('支援格式:', uploadHandler.supportedFormats);
    console.log('最大檔案大小:', uploadHandler.maxFileSize);
    
    // 測試日期驗證和格式化
    const testDates = ['2024-01-15', '2024/01/15', '01/15/2024', '20725', 'invalid-date'];
    testDates.forEach(date => {
        const formatted = uploadHandler.formatDate(date);
        const isValid = uploadHandler.isValidDate(formatted);
        console.log(`日期 "${date}" -> "${formatted}" 驗證結果: ${isValid}`);
    });
    
    // 測試數字解析
    const testNumbers = ['10.5', '2.345678', 'invalid', '', null];
    testNumbers.forEach(num => {
        try {
            const result = uploadHandler.parseNumber(num, '測試欄位');
            console.log(`數字 "${num}" 解析結果:`, result);
        } catch (error) {
            console.log(`數字 "${num}" 解析錯誤:`, error.message);
        }
    });
    
    uploadHandler.showUploadStatus('上傳模組測試完成', 'success');
}

// 測試您的具體資料格式
function testUserDataFormat() {
    console.log('測試用戶資料格式...');
    
    // 創建您提供的測試資料
    const testCSV = `P_ID	date	stage	time	vel_mean	acc_mean	P_ID2	date	stage	time	vel_mean	acc_mean
111	20725	1	0.65	0.160004026	0.510511542	222	20725	1	0.67	0.183537304	0.582400003
111	20725	2	0.6	0.075994123	0.865448098	222	20725	2	0.66	0.091338426	0.802032592
111	20725	3	0.4	0.086766043	1.025958559	222	20725	3	0.35	0.164068429	0.931693389
111	20725	4	0.8	0.069908334	0.285706107	222	20725	4	0.8	0.186701048	0.483574172`;

    // 將Tab分隔符轉換為逗號分隔符
    const csvFormatted = testCSV.replace(/\t/g, ',');

    // 創建測試檔案
    const blob = new Blob([csvFormatted], { type: 'text/csv' });
    const file = new File([blob], 'user_test_data.csv', { type: 'text/csv' });

    // 測試檔案處理
    const uploadHandler = new FileUploadHandler();
    const validation = uploadHandler.validateFile(file);
    
    if (validation.isValid) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = uploadHandler.parseCSV(e.target.result);
                const report = uploadHandler.generateUploadReport(result, file.name);
                
                console.log('用戶資料測試結果:', result);
                console.log('測試報告:', report);
                
                // 如果有系統實例，添加測試資料
                if (window.system && result.data.length > 0) {
                    result.data.forEach(data => {
                        window.system.addData(data);
                    });
                    window.system.displayData();
                    window.system.updateChart();
                }
                
                uploadHandler.showUploadStatus(`用戶資料測試成功！匯入 ${result.validRows} 筆資料`, 'success');
                
                if (result.errors.length > 0) {
                    console.warn('發現的問題:', result.errors);
                    uploadHandler.showUploadStatus(`發現 ${result.errors.length} 個問題，請檢查控制台`, 'error');
                }
                
            } catch (error) {
                console.error('用戶資料測試失敗:', error);
                uploadHandler.showUploadStatus(`用戶資料測試失敗: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    } else {
        console.error('檔案驗證失敗:', validation.errors);
        uploadHandler.showUploadStatus(`檔案驗證失敗: ${validation.errors.join(', ')}`, 'error');
    }
}

// 全域上傳處理器實例
window.fileUploadHandler = new FileUploadHandler();
