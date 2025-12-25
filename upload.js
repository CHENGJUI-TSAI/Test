// 檔案上傳處理模組
class FileUploadHandler {
    constructor() {
        this.supportedFormats = ['.csv', '.xlsx', '.xls'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.initialize();
    }

    // 隨機工具
    randomChoice(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    shuffleArray(arr) {
        if (!Array.isArray(arr)) return arr;
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    randomBool(p = 0.5) { return Math.random() < p; }

    // 產生兩位選手的綜合比較分析（較自由的 AI 風格輸出）
    generateCombinedAnalysis(metaA, metaB, idA, idB) {
        try {
            const a = metaA && metaA.metrics ? metaA.metrics : {};
            const b = metaB && metaB.metrics ? metaB.metrics : {};
            const aTime = typeof a.avg_time === 'number' ? a.avg_time : null;
            const bTime = typeof b.avg_time === 'number' ? b.avg_time : null;
            const aVel = typeof a.avg_vel === 'number' ? a.avg_vel : null;
            const bVel = typeof b.avg_vel === 'number' ? b.avg_vel : null;
            const aAcc = typeof a.avg_acc === 'number' ? a.avg_acc : null;

            const pa = metaA && metaA.perStageStats ? metaA.perStageStats : {};
            const pb = metaB && metaB.perStageStats ? metaB.perStageStats : {};

            // Summary
            let summary = '';
            if (aTime !== null && bTime !== null) {
                const diff = (bTime - aTime);
                const absd = Math.abs(diff);
                if (absd < 0.05) summary = `${idA || '選手A'} 與 ${idB || '選手B'} 表現相近（平均時間 ${aTime.toFixed(2)}s vs ${bTime.toFixed(2)}s）。`;
                else if (diff > 0) summary = `${idA || '選手A'} 整體較快 ${absd.toFixed(2)}s（${aTime.toFixed(2)}s vs ${bTime.toFixed(2)}s）。`;
                else summary = `${idB || '選手B'} 整體較快 ${absd.toFixed(2)}s（${bTime.toFixed(2)}s vs ${aTime.toFixed(2)}s）。`;
            } else {
                summary = '缺乏完整平均時間資料，僅能基於可用指標提供建議。';
            }

            // Key comparisons
            const keyLines = [];
            if (aTime !== null && bTime !== null) keyLines.push(`平均時間：${aTime.toFixed(2)}s / ${bTime.toFixed(2)}s`);
            if (aVel !== null && bVel !== null) keyLines.push(`平均速度：${aVel.toFixed(3)} / ${bVel.toFixed(3)}`);
            if (aAcc !== null && bAcc !== null) keyLines.push(`平均加速度：${aAcc.toFixed(3)} / ${bAcc.toFixed(3)}`);

            // Per-stage highlights (which stages show meaningful gaps)
            const stageHighlights = [];
            const stages = Array.from(new Set([...Object.keys(pa), ...Object.keys(pb)])).sort((x,y)=>Number(x)-Number(y));
            stages.forEach(s => {
                const sa = pa[s] && typeof pa[s].avg_time === 'number' ? pa[s].avg_time : null;
                const sb = pb[s] && typeof pb[s].avg_time === 'number' ? pb[s].avg_time : null;
                if (sa != null && sb != null) {
                    const d = sb - sa; // positive -> a faster
                    if (Math.abs(d) > 0.06) {
                        const better = d > 0 ? (idA || '選手A') : (idB || '選手B');
                        stageHighlights.push(`第${s}段：${sa.toFixed(2)}s vs ${sb.toFixed(2)}s，較佳：${better}`);
                    }
                }
            });

            // Prioritized recommendations
            const recs = [];
            // short-term: address start/accel if time gap exists
            if (aTime !== null && bTime !== null) {
                const fasterId = aTime < bTime ? (idA || '選手A') : (idB || '選手B');
                const slowerId = aTime < bTime ? (idB || '選手B') : (idA || '選手A');
                recs.push(`短期優先：${slowerId} 可參考 ${fasterId} 的起跑與前段加速策略，重點練習起跑爆發 (6-10m 短衝)。`);
            }
            // velocity/accel specific
            if (aVel !== null && bVel !== null) {
                if (aVel + 0.02 < bVel) recs.push(`${idA || '選手A'} 速度顯著較低，建議加入短距離技術與速度訓練。`);
                else if (bVel + 0.02 < aVel) recs.push(`${idB || '選手B'} 速度顯著較低，建議加入短距離技術與速度訓練。`);
            }
            if (aAcc !== null && bAcc !== null) {
                if (aAcc + 0.08 < bAcc) recs.push(`${idA || '選手A'} 加速度較弱，優先做力量/起步訓練。`);
                else if (bAcc + 0.08 < aAcc) recs.push(`${idB || '選手B'} 加速度較弱，優先做力量/起步訓練。`);
            }
            if (stageHighlights.length > 0) recs.push(`針對性：以分段為單位做重點訓練，優先處理以下差距明顯的階段：${stageHighlights.slice(0,3).join('；')}`);

            // Concrete drills
            const drills = [
                '短距離爆發：6-10m x6 衝刺，專注起步與姿勢，休息 60-90s',
                '分段重複：選取最慢的 1-2 段，做 4-6 組區段重複',
                '力量訓練：深蹲/硬舉 3-4 組 x 4-6 次，提升爆發力'
            ];

            // Assemble output
            const out = [];
            out.push(`綜合比較總結： ${summary}`);
            if (keyLines.length) out.push(`關鍵指標：${keyLines.join('；')}`);
            if (stageHighlights.length) out.push(`分段重點：${stageHighlights.slice(0,4).join('；')}`);
            if (recs.length) out.push(`優先建議：\n- ${recs.join('\n- ')}`);
            out.push(`推薦練習：\n- ${drills.join('\n- ')}`);

            return out.join('\n\n');
        } catch (e) {
            console.warn('generateCombinedAnalysis error', e);
            return '無法產生綜合分析。';
        }
    }

    // 呼叫外部 AI API（簡單封裝）
    async callExternalAI(apiUrl, apiKey, prompt, timeout = 20000, provider = 'custom') {
        if (!apiUrl) throw new Error('apiUrl required');
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            let headers = { 'Content-Type': 'application/json' };
            let body = null;

            if (provider === 'google_gemini') {
                // Gemin i expects contents.parts.text
                if (apiKey) headers['X-goog-api-key'] = apiKey;
                body = { contents: [{ parts: [{ text: prompt }] }] };
            } else if (provider === 'openai') {
                if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
                // default model can be adjusted by user; keep compact payload
                body = { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.2 };
            } else {
                if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
                body = { prompt };
            }

            const resp = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal
            });
            clearTimeout(id);
            if (!resp.ok) throw new Error(`API error ${resp.status}`);

            // try parse as json, otherwise return text
            const txt = await resp.text();
            try { return JSON.parse(txt); } catch (e) { return txt; }
        } finally { clearTimeout(id); }
    }

    // 將 meta 與簡短提示組成 prompt
    buildPromptForExternalAnalysis(metaA, metaB, idA, idB) {
        const lines = [];
        lines.push('請擔任運動分析師，根據下列資料產生比較分析與訓練建議。');
        lines.push('輸出可為自然語句，分段，重點用簡短標題');
        lines.push('---');
        lines.push(`選手A: ${idA || 'A'}`);
        if (metaA && metaA.metrics) lines.push(`平均時間: ${metaA.metrics.avg_time || 'N/A'}, 平均速度: ${metaA.metrics.avg_vel || 'N/A'}, 平均加速度: ${metaA.metrics.avg_acc || 'N/A'}`);
        if (metaA && metaA.perStageStats) lines.push(`分段樣本: ${Object.keys(metaA.perStageStats).length}`);
        lines.push('---');
        lines.push(`選手B: ${idB || 'B'}`);
        if (metaB && metaB.metrics) lines.push(`平均時間: ${metaB.metrics.avg_time || 'N/A'}, 平均速度: ${metaB.metrics.avg_vel || 'N/A'}, 平均加速度: ${metaB.metrics.avg_acc || 'N/A'}`);
        if (metaB && metaB.perStageStats) lines.push(`分段樣本: ${Object.keys(metaB.perStageStats).length}`);
        lines.push('---');
        lines.push('請先給出一段總結（1-2 句），接著給出重點建議（列點），最後列出 1-2 個訓練動作建議。');
        return lines.join('\n');
    }

    initialize() {
        console.log('檔案上傳模組初始化完成');
        // 在初始化時加入 AI 分析按鈕（失敗時不阻塞整個模組）
        try {
            this.setupAIAnalyzeButton();
        } catch (e) {
            console.warn('初始化 AI 分析按鈕時發生錯誤:', e);
        }
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

        const resultObj = {
            data: data,
            errors: errors,
            totalRows: lines.length - 1,
            validRows: data.length
        };

        // 儲存最近一次解析結果，供 AI 分析按鈕使用
        try {
            this._lastParseResult = resultObj;
        } catch (e) {
            console.warn('儲存解析結果失敗:', e);
        }

        return resultObj;
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

        // 產生基於匯入資料的 AI 建議
        try {
            const suggestions = this.generateAISuggestions(result);
            if (suggestions && suggestions.length > 0) {
                report += '\nAI 建議:\n';
                suggestions.forEach(s => { report += `- ${s}\n`; });
            }
        } catch (e) {
            console.warn('產生 AI 建議時發生錯誤:', e);
        }

        return report;
    }

    // 產生簡單的 AI 建議（基於統計與資料檢查的啟發式建議）
    generateAISuggestions(result) {
        const suggestions = [];
        const data = result && result.data ? result.data : [];

        if (result.errors && result.errors.length > 0) {
            suggestions.push(`檢測到 ${result.errors.length} 個解析錯誤，建議先修正原始檔案中的格式或缺失值。`);
        }

        if (data.length === 0) {
            suggestions.push('資料集為空，無法提供進一步建議。');
            return suggestions;
        }

        // 聚合數值欄位
        const numericFields = { time: [], vel_mean: [], acc_mean: [] };
        const keyCounts = {};

        data.forEach(row => {
            if (typeof row.time === 'number') numericFields.time.push(row.time);
            if (typeof row.vel_mean === 'number') numericFields.vel_mean.push(row.vel_mean);
            if (typeof row.acc_mean === 'number') numericFields.acc_mean.push(row.acc_mean);

            const key = `${row.p_id}|${row.date}|${row.stage}`;
            keyCounts[key] = (keyCounts[key] || 0) + 1;
        });

        // 重複檢查
        const duplicates = Object.entries(keyCounts).filter(([,c]) => c > 1);
        if (duplicates.length > 0) {
            suggestions.push(`發現 ${duplicates.length} 組重複 (相同 P_ID+日期+階段)，建議檢查是否為重複匯入或資料重複。`);
        }

        // 統計與異常值檢查的幫助函數
        function stats(arr) {
            if (!arr || arr.length === 0) return null;
            const mean = arr.reduce((a,b) => a + b, 0) / arr.length;
            const sd = Math.sqrt(arr.reduce((s,v) => s + Math.pow(v - mean, 2), 0) / arr.length);
            return { mean, sd };
        }

        const sTime = stats(numericFields.time);
        const sVel = stats(numericFields.vel_mean);
        const sAcc = stats(numericFields.acc_mean);

        if (sTime) {
            suggestions.push(`時間: 平均 ${sTime.mean.toFixed(2)}，標準差 ${sTime.sd.toFixed(2)}。`);
            const outliers = data.filter(r => typeof r.time === 'number' && Math.abs(r.time - sTime.mean) > 2 * sTime.sd);
            if (outliers.length > 0) {
                suggestions.push(`發現 ${outliers.length} 個時間異常值，建議檢查。例如: ${outliers.slice(0,3).map(o => `(${o.p_id}, ${o.date}, stage ${o.stage}, time ${o.time})`).join('; ')}`);
            }
        }

        if (sVel) {
            suggestions.push(`平均速度: 平均 ${sVel.mean.toFixed(3)}，標準差 ${sVel.sd.toFixed(3)}。`);
            const outliers = data.filter(r => typeof r.vel_mean === 'number' && Math.abs(r.vel_mean - sVel.mean) > 3 * sVel.sd);
            if (outliers.length > 0) {
                suggestions.push(`發現 ${outliers.length} 個速度異常值 (>=3σ)，建議檢查感測器或資料錄入。`);
            }
        }

        if (sAcc) {
            suggestions.push(`平均加速度: 平均 ${sAcc.mean.toFixed(3)}，標準差 ${sAcc.sd.toFixed(3)}。`);
            const outliers = data.filter(r => typeof r.acc_mean === 'number' && Math.abs(r.acc_mean - sAcc.mean) > 3 * sAcc.sd);
            if (outliers.length > 0) {
                suggestions.push(`發現 ${outliers.length} 個加速度異常值 (>=3σ)，建議確認單位與量測設定。`);
            }
        }

        // 整體建議
        if (data.length < 10) {
            suggestions.push('資料筆數較少，建議收集更多樣本以提升統計可靠度。');
        } else {
            suggestions.push('資料量足以進行基本統計分析，建議依需求進一步做分組比較或視覺化檢查。');
        }

        return suggestions;
    }

    // 分析訓練後的模型結果並回傳建議
    // trainedMeta 範例結構:
    // {
    //   metrics: { train_loss, val_loss, train_acc, val_acc, ... },
    //   classCounts: { 'classA': 100, 'classB': 10 },
    //   featureImportance: { feat1: 0.4, feat2: 0.01, ... },
    //   predictions: [ {yTrue, yPred, sampleId}, ... ]
    // }
    analyzeTrainedData(trainedMeta) {
        const suggestions = [];
        if (!trainedMeta || typeof trainedMeta !== 'object') {
            suggestions.push('未提供訓練後的元資料，無法產生訓練分析建議。');
            return suggestions;
        }

        const metrics = trainedMeta.metrics || {};

        // 檢查過擬合/欠擬合
        if (metrics.train_loss !== undefined && metrics.val_loss !== undefined) {
            const trainLoss = metrics.train_loss;
            const valLoss = metrics.val_loss;
            if (trainLoss * 1.2 < valLoss) {
                suggestions.push('可能過擬合：驗證損失顯著高於訓練損失，建議增加正則化、減少模型複雜度或收集更多資料。');
            } else if (trainLoss > 0.5 && valLoss > 0.5) {
                suggestions.push('可能欠擬合：訓練與驗證損失皆偏高，建議增加模型容量或改善特徵工程。');
            } else {
                suggestions.push('訓練/驗證損失看起來合理，建議檢查學習曲線以確認穩定性。');
            }
        }

        // 檢查準確度差距
        if (metrics.train_acc !== undefined && metrics.val_acc !== undefined) {
            const dAcc = metrics.train_acc - metrics.val_acc;
            if (dAcc > 0.1) {
                suggestions.push('訓練準確度明顯高於驗證，可能過擬合，建議使用交叉驗證並檢查資料洩漏。');
            }
        }

        // 類別不平衡檢查
        if (trainedMeta.classCounts) {
            const counts = trainedMeta.classCounts;
            const vals = Object.values(counts).filter(v => typeof v === 'number');
            if (vals.length >= 2) {
                const max = Math.max(...vals);
                const min = Math.min(...vals);
                if (max / Math.max(min, 1) > 10) {
                    suggestions.push('檢測到類別不平衡（某些類別樣本數遠高於其他類別），建議採樣或使用權重平衡策略。');
                }
            }
        }

        // 特徵重要性建議
        if (trainedMeta.featureImportance) {
            const fi = trainedMeta.featureImportance;
            const low = Object.entries(fi).filter(([,v]) => v < 0.02).map(([k]) => k);
            if (low.length > 0) {
                suggestions.push(`發現 ${low.length} 個重要性很低的特徵（<2%），可考慮移除或重新工程，例如: ${low.slice(0,6).join(', ')}。`);
            }
        }

        // 錯誤分析（若提供 predictions）
        if (Array.isArray(trainedMeta.predictions) && trainedMeta.predictions.length > 0) {
            const preds = trainedMeta.predictions;
            const mis = preds.filter(p => p.yTrue !== undefined && p.yPred !== undefined && p.yTrue !== p.yPred);
            if (mis.length > 0) {
                suggestions.push(`在提供的預測中發現 ${mis.length} 個錯誤分類樣本，建議檢視常見誤分類的樣本與其特徵。`);
            }
        }

        // 針對選手資料產生單段、可靠的回饋（以時間長短為主），刪除所有模型訓練相關建議
        try {
            const metrics = trainedMeta.metrics || {};
            const avgTime = typeof metrics.avg_time === 'number' ? metrics.avg_time : null;
            const avgVel = typeof metrics.avg_vel === 'number' ? metrics.avg_vel : null;
            const avgAcc = typeof metrics.avg_acc === 'number' ? metrics.avg_acc : null;

            // 若有 perStageStats，找出表現最差的階段
            let worstStageInfo = null;
            if (trainedMeta.perStageStats) {
                const entries = Object.entries(trainedMeta.perStageStats || {}).map(([k,v]) => ({stage: k, avg_time: v.avg_time}));
                if (entries.length > 0) {
                    entries.sort((a,b) => b.avg_time - a.avg_time);
                    worstStageInfo = entries[0];
                }
            }

            // 建立單段回饋文字
            let line = '';
            if (avgTime !== null) line += `平均時間 ${avgTime.toFixed(2)}s，`;
            if (avgVel !== null) line += `平均速度 ${avgVel.toFixed(3)}，`;
            if (avgAcc !== null) line += `平均加速度 ${avgAcc.toFixed(3)}。`;

            // 若找得到較慢的階段，提出具體建議
            if (worstStageInfo) {
                const wStage = worstStageInfo.stage;
                const wTime = worstStageInfo.avg_time;
                line += ` 發現表現較差的階段：第 ${wStage} 階段（時間 ${wTime.toFixed(2)}s），建議針對該階段進行分段訓練（短距離衝刺 / 節奏訓練）以提升速度與爆發力。`;
            } else {
                line += ' 整體表現無明顯落差，建議以技術細節與節奏訓練為主，並持續記錄每次訓練的秒數以追蹤改善情形。';
            }

            // 若有顯著超過平均的階段數量，可加入一句建議
            if (trainedMeta.perStageStats && avgTime !== null) {
                const above = Object.values(trainedMeta.perStageStats).filter(s => s.avg_time > avgTime * 1.05).length;
                if (above > 0) {
                    line += ` 發現 ${above} 個階段時間高於平均，建議將訓練重點放在這些階段以縮短秒數。`;
                }
            }

            // 一致輸出單段回饋
            suggestions.push(line.trim());
        } catch (e) {
            suggestions.push('資料分析發生錯誤，無法產生回饋。');
            console.warn('analyzeTrainedData error:', e);
        }

        return suggestions;
    }

    // 在頁面上建立 AI 分析按鈕與結果容器（插入到 .file-upload-section）
    setupAIAnalyzeButton() {
        if (document.getElementById('aiAnalysisContainer')) return; // 已建立

        // 建立一個獨立的卡片（使用現有的 .export-category 樣式）
        const wrapper = document.createElement('div');
        wrapper.className = 'export-category';
        wrapper.style.marginTop = '16px';

        const title = document.createElement('h3');
        title.textContent = 'AI 分析報告';
        wrapper.appendChild(title);

        const container = document.createElement('div');
        container.id = 'aiAnalysisContainer';
        container.style.margin = '8px 0';

        const btn1 = document.createElement('button');
        btn1.id = 'aiAnalyzePlayer1';
        btn1.textContent = '分析選手1';
        btn1.className = 'ai-btn primary';
        btn1.addEventListener('click', () => this.performAIAnalysis('player1'));

        const btn2 = document.createElement('button');
        btn2.id = 'aiAnalyzePlayer2';
        btn2.textContent = '分析選手2';
        btn2.className = 'ai-btn secondary';
        btn2.addEventListener('click', () => this.performAIAnalysis('player2'));

        const btn3 = document.createElement('button');
        btn3.id = 'aiAnalyzeBoth';
        btn3.textContent = '分析雙方';
        btn3.className = 'ai-btn warning';
        btn3.addEventListener('click', () => this.performAIAnalysis('combined'));

        // external AI controls
        const externalWrap = document.createElement('div');
        externalWrap.style.display = 'flex';
        externalWrap.style.gap = '8px';
        externalWrap.style.alignItems = 'center';
        externalWrap.style.margin = '8px 0 12px 0';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.id = 'aiUseExternal';
        chk.title = '使用遠端 AI API 進行分析';

        const chkLabel = document.createElement('label');
        chkLabel.htmlFor = 'aiUseExternal';
        chkLabel.textContent = '使用線上 AI';

        // provider preset select
        const provider = document.createElement('select');
        provider.id = 'aiProvider';
        provider.style.padding = '8px';
        provider.style.borderRadius = '6px';
        provider.style.border = '1px solid #ddd';
        const optCustom = document.createElement('option'); optCustom.value = 'custom'; optCustom.text = '自訂';
        const optGemini = document.createElement('option'); optGemini.value = 'google_gemini'; optGemini.text = 'Google Gemini';
        const optOpenAI = document.createElement('option'); optOpenAI.value = 'openai'; optOpenAI.text = 'OpenAI';
        provider.appendChild(optCustom); provider.appendChild(optGemini); provider.appendChild(optOpenAI);
        provider.addEventListener('change', () => {
            const v = provider.value;
            if (v === 'google_gemini') {
                endpoint.value = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
                endpoint.placeholder = 'Google Gemini endpoint';
                keyInput.placeholder = 'X-goog-api-key';
            } else if (v === 'openai') {
                endpoint.value = 'https://api.openai.com/v1/chat/completions';
                endpoint.placeholder = 'OpenAI Chat Completions endpoint';
                keyInput.placeholder = 'Bearer API Key';
            } else {
                endpoint.value = '';
                endpoint.placeholder = 'API Endpoint (自訂)';
                keyInput.placeholder = 'API Key (可選)';
            }
        });

        const endpoint = document.createElement('input');
        endpoint.type = 'text';
        endpoint.id = 'aiEndpoint';
        endpoint.placeholder = 'API Endpoint (必填)';
        endpoint.style.flex = '1';
        endpoint.style.padding = '8px';
        endpoint.style.borderRadius = '6px';
        endpoint.style.border = '1px solid #ddd';

        const keyInput = document.createElement('input');
        keyInput.type = 'password';
        keyInput.id = 'aiApiKey';
        keyInput.placeholder = 'API Key (可選)';
        keyInput.style.padding = '8px';
        keyInput.style.borderRadius = '6px';
        keyInput.style.border = '1px solid #ddd';

        externalWrap.appendChild(chk);
        externalWrap.appendChild(chkLabel);
        externalWrap.appendChild(provider);
        externalWrap.appendChild(endpoint);
        externalWrap.appendChild(keyInput);

        wrapper.appendChild(externalWrap);

        const output = document.createElement('div');
        output.id = 'aiAnalysisOutput';
        output.style.display = 'none';
        output.style.marginTop = '12px';
        output.style.background = 'white';
        output.style.padding = '12px';
        output.style.border = '1px solid #e9ecef';
        output.style.borderRadius = '8px';
        output.className = 'ai-analysis-output';

        // 按鈕順序：選手1 / 選手2 / 雙方
        container.appendChild(btn1);
        container.appendChild(btn2);
        container.appendChild(btn3);
        wrapper.appendChild(container);
        wrapper.appendChild(output);

        // 插入到 .export-section（若存在），否則放到 .file-upload-section，最後降級到 body 頂部
        const exportSection = document.querySelector('.export-section');
        const fileSection = document.querySelector('.file-upload-section');
        if (exportSection) {
            // 將 wrapper 放在 exportSection 的底部（匯出按鈕下方）
            exportSection.appendChild(wrapper);
        } else if (fileSection) {
            fileSection.appendChild(wrapper);
        } else {
            document.body.insertBefore(wrapper, document.body.firstChild);
        }
    }

    

    // 執行 AI 分析並顯示結果，會儲存歷史與提供下載
    performAIAnalysis(targetKey) {
        const outputEl = document.getElementById('aiAnalysisOutput');
        if (outputEl) {
            outputEl.style.display = 'block';
            // start animated "AI 分析中" with moving dots
            let dots = 0;
            outputEl.textContent = 'AI 分析中';
            if (this._aiAnalysisInterval) {
                clearInterval(this._aiAnalysisInterval);
                this._aiAnalysisInterval = null;
            }
            this._aiAnalysisInterval = setInterval(() => {
                try {
                    dots = (dots + 1) % 4; // 0..3
                    outputEl.textContent = 'AI 分析中' + '.'.repeat(dots);
                } catch (e) { /* ignore */ }
            }, 450);
            // 若有尚未到時的最終化計時器，先清除（避免上一次分析仍會顯示結果）
            if (this._aiFinalTimeout) {
                clearTimeout(this._aiFinalTimeout);
                this._aiFinalTimeout = null;
            }
        }

        // detect external AI settings
        const useExternal = document.getElementById('aiUseExternal') && document.getElementById('aiUseExternal').checked;
        const apiUrl = document.getElementById('aiEndpoint') ? document.getElementById('aiEndpoint').value.trim() : '';
        const apiKey = document.getElementById('aiApiKey') ? document.getElementById('aiApiKey').value.trim() : '';

        // 優先使用畫面上顯示的資料表（以 tableBody 為準），再 fallback 到 window.system.data，最後使用最近一次解析結果
        const tableData = this.getDataFromTable();
        const currentData = (tableData && tableData.length > 0)
            ? tableData
            : ((window.system && Array.isArray(window.system.data) && window.system.data.length > 0)
                ? window.system.data
                : (this._lastParseResult && Array.isArray(this._lastParseResult.data) ? this._lastParseResult.data : []));

        const ids = Array.from(new Set((currentData || []).map(r => r.p_id).filter(Boolean)));
        const playerA = ids[0] || null;
        const playerB = ids[1] || null;

        const results = {};

        // Helper to build and analyze one target
        const analyzeOne = (label, id) => {
            let meta = null;
            if (window.trainedMeta && id && window.trainedMeta[id]) meta = window.trainedMeta[id];
            if (!meta && window.system && typeof window.system.getTrainedMeta === 'function' && id) {
                try { meta = window.system.getTrainedMeta(id); } catch (e) { meta = null; }
            }
            // 從當前資料構建
            if (!meta) {
                let sourceData = currentData || [];
                if (id && id !== 'combined') sourceData = sourceData.filter(r => r.p_id === id);
                if (!sourceData || sourceData.length === 0) {
                    meta = { metrics: {}, classCounts: {}, featureImportance: {}, predictions: [] };
                } else {
                    meta = this.buildTrainedMetaFromData(sourceData);
                }
            }

            const suggestions = this.analyzeTrainedData(meta);
            results[label] = { meta, suggestions, playerId: id };
        };

        if (!targetKey) {
            // 原始行為：一次產生三個
            analyzeOne('選手一', playerA);
            analyzeOne('選手二', playerB);
            // 產生綜合比較分析（AI 風格）
            try {
                const aMeta = results['選手一'] ? results['選手一'].meta : null;
                const bMeta = results['選手二'] ? results['選手二'].meta : null;
                const combinedText = this.generateCombinedAnalysis(aMeta, bMeta, playerA, playerB);
                results['綜合'] = { meta: null, suggestions: [combinedText], playerId: 'combined' };
            } catch (e) {
                console.warn('generateCombinedAnalysis error', e);
                results['綜合'] = { meta: null, suggestions: ['無法產生綜合分析。'], playerId: 'combined' };
            }
        } else if (targetKey === 'player1') {
            analyzeOne('選手一', playerA);
        } else if (targetKey === 'player2') {
            analyzeOne('選手二', playerB);
        } else if (targetKey === 'combined') {
            // produce combined using both players' meta
            analyzeOne('選手一', playerA);
            analyzeOne('選手二', playerB);
            try {
                const aMeta = results['選手一'] ? results['選手一'].meta : null;
                const bMeta = results['選手二'] ? results['選手二'].meta : null;
                const combinedText = this.generateCombinedAnalysis(aMeta, bMeta, playerA, playerB);
                results['綜合'] = { meta: null, suggestions: [combinedText], playerId: 'combined' };
            } catch (e) {
                console.warn('generateCombinedAnalysis error', e);
                results['綜合'] = { meta: null, suggestions: ['無法產生綜合分析。'], playerId: 'combined' };
            }
        }

        // 儲存並顯示 (如果需呼叫外部 AI，特別處理綜合)
        const finalizeAndShow = (finalResults) => {
            // 停止分析中動畫並在顯示前加入兩個稍微隨機化的 AI 評語，並標示兩個 AI 成功
            try {
                if (this._aiAnalysisInterval) {
                    clearInterval(this._aiAnalysisInterval);
                    this._aiAnalysisInterval = null;
                }
            } catch (e) { console.warn('清除分析動畫失敗', e); }

            // 在顯示前加入兩個稍微隨機化的 AI 評語，並標示兩個 AI 成功
            try {
                const aiRemarks = this.generateTwoRandomAiRemarks(finalResults['選手一'], finalResults['選手二']);
                if (aiRemarks && Array.isArray(aiRemarks)) {
                    finalResults['AI一'] = { meta: null, suggestions: [aiRemarks[0]] };
                    // 不再加入 AI二（依使用者要求）
                }
                // 確保不會保存或顯示任何系統狀態鍵（例如舊的 '系統狀態'）
                if (finalResults['系統狀態']) delete finalResults['系統狀態'];
            } catch (e) {
                console.warn('加入 AI 評語時發生錯誤:', e);
            }

            this._lastAnalysisResults = finalResults;
            this.saveAnalysisHistory(finalResults);
            const reportHtml = this.formatAISuggestionsReportCompact(finalResults);
            if (outputEl) outputEl.innerHTML = reportHtml; else console.log(reportHtml);
        };

        // Helper to schedule finalization after a random 5-10s "thinking" delay
        const scheduleFinalization = (finalResults) => {
            const min = 5000, max = 10000;
            const delay = Math.floor(Math.random() * (max - min + 1)) + min;
            this._aiFinalTimeout = setTimeout(() => {
                try { finalizeAndShow(finalResults); }
                finally { this._aiFinalTimeout = null; }
            }, delay);
        };

        // If external AI is enabled and combined requested, call external then finalize
        if (useExternal && apiUrl && (targetKey === 'combined' || !targetKey)) {
            (async () => {
                try {
                    // ensure we have both player metas
                    const aMeta = results['選手一'] ? results['選手一'].meta : null;
                    const bMeta = results['選手二'] ? results['選手二'].meta : null;
                    const prompt = this.buildPromptForExternalAnalysis(aMeta, bMeta, playerA, playerB);
                    const providerVal = document.getElementById('aiProvider') ? document.getElementById('aiProvider').value : 'custom';
                    const aiResp = await this.callExternalAI(apiUrl, apiKey, prompt, 20000, providerVal);
                    let txt = '';
                    if (typeof aiResp === 'string') txt = aiResp;
                    else if (aiResp && aiResp.choices && aiResp.choices[0] && (aiResp.choices[0].text || aiResp.choices[0].message)) {
                        txt = aiResp.choices[0].text || aiResp.choices[0].message || '';
                    } else if (aiResp && aiResp.text) txt = aiResp.text;
                    else if (aiResp && aiResp.candidates && aiResp.candidates[0]) {
                        // Google Gemini often returns candidates with content.parts
                        const cand = aiResp.candidates[0];
                        if (cand.content && Array.isArray(cand.content)) {
                            // join any text parts
                            const parts = [];
                            cand.content.forEach(c => { if (c && c.text) parts.push(c.text); });
                            txt = parts.join('\n') || JSON.stringify(cand);
                        } else if (cand.output) txt = cand.output;
                        else txt = JSON.stringify(cand);
                    } else if (typeof aiResp === 'object') txt = JSON.stringify(aiResp);

                    results['綜合'] = { meta: null, suggestions: [String(txt)], playerId: 'combined' };
                } catch (e) {
                    console.warn('External AI failed, falling back to local:', e);
                    // if external fails, keep existing results['綜合'] (may be present) or generate locally
                    if (!results['綜合']) {
                        try {
                            const combinedText = this.generateCombinedAnalysis(results['選手一'] ? results['選手一'].meta : null, results['選手二'] ? results['選手二'].meta : null, playerA, playerB);
                            results['綜合'] = { meta: null, suggestions: [combinedText], playerId: 'combined' };
                        } catch (e2) {
                            results['綜合'] = { meta: null, suggestions: ['無法產生綜合分析。'], playerId: 'combined' };
                        }
                    }
                } finally {
                    scheduleFinalization(results);
                }
            })();
            return;
        }

        // otherwise finalize immediately
        scheduleFinalization(results);
    }

    // 從資料快速建構訓練 meta（簡易）
    buildTrainedMetaFromData(data) {
        const numeric = { time: [], vel_mean: [], acc_mean: [] };
        const classCounts = {};
        const perStage = {}; // stage -> { times: [], vels: [], accs: [] }
        data.forEach(r => {
            if (typeof r.time === 'number') numeric.time.push(r.time);
            if (typeof r.vel_mean === 'number') numeric.vel_mean.push(r.vel_mean);
            if (typeof r.acc_mean === 'number') numeric.acc_mean.push(r.acc_mean);
            classCounts[r.stage] = (classCounts[r.stage] || 0) + 1;
            const s = String(r.stage || '0');
            if (!perStage[s]) perStage[s] = { times: [], vels: [], accs: [] };
            if (typeof r.time === 'number') perStage[s].times.push(r.time);
            if (typeof r.vel_mean === 'number') perStage[s].vels.push(r.vel_mean);
            if (typeof r.acc_mean === 'number') perStage[s].accs.push(r.acc_mean);
        });

        function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null; }
        const metrics = { avg_time: mean(numeric.time), avg_vel: mean(numeric.vel_mean), avg_acc: mean(numeric.acc_mean) };

        const perStageStats = {};
        Object.keys(perStage).forEach(k => {
            perStageStats[k] = {
                avg_time: mean(perStage[k].times) || 0,
                avg_vel: mean(perStage[k].vels) || 0,
                avg_acc: mean(perStage[k].accs) || 0,
                count: (perStage[k].times || []).length
            };
        });

        return { metrics, classCounts, featureImportance: {}, predictions: [], perStageStats, _source: 'data' };
    }

    // 從畫面上目前的資料表讀取資料（優先來源）
    getDataFromTable() {
        try {
            const tbody = document.getElementById('tableBody');
            if (!tbody) return [];
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const out = [];
            rows.forEach(tr => {
                const cells = tr.querySelectorAll('td');
                if (!cells || cells.length < 7) return;
                // 假設欄位順序: 選擇, P_ID, Date, Stage, Time, Vel_mean, Acc_mean, 操作
                const p_id = cells[1] ? cells[1].textContent.trim() : '';
                const date = cells[2] ? cells[2].textContent.trim() : '';
                const stage = cells[3] ? parseFloat(cells[3].textContent.trim()) : NaN;
                const time = cells[4] ? parseFloat(cells[4].textContent.trim()) : NaN;
                const vel_mean = cells[5] ? parseFloat(cells[5].textContent.trim()) : NaN;
                const acc_mean = cells[6] ? parseFloat(cells[6].textContent.trim()) : NaN;
                if (p_id) {
                    out.push({ p_id, date, stage, time, vel_mean, acc_mean });
                }
            });
            return out;
        } catch (e) {
            console.warn('從表格讀取資料失敗:', e);
            return [];
        }
    }

    // 將分析結果格式化為可閱讀字串
    formatAISuggestionsReport(results) {
        let out = '';
        Object.keys(results).forEach(key => {
            out += `=== ${key} ===\n`;
            const s = results[key].suggestions || [];
            if (s.length === 0) out += '（無建議）\n';
            else s.forEach(line => { out += `- ${line}\n`; });
            out += '\n';
        });
        return out;
    }

    // 壓縮格式：輸出像範例那種單段/分段自然語句，便於直接放在卡片內
    formatAISuggestionsReportCompact(results) {
        // results keys: 選手一 / 選手二 / 綜合
        const parts = [];
        const p1 = results['選手一'];
        const p2 = results['選手二'];

        // 比較段（有選手一與選手二時）
        if (p1 && p2) {
            const a = p1.meta && p1.meta.metrics ? p1.meta.metrics : {};
            const b = p2.meta && p2.meta.metrics ? p2.meta.metrics : {};
            const p1Id = p1.playerId || '';
            const p2Id = p2.playerId || '';
            const aTimeNum = typeof a.avg_time === 'number' ? a.avg_time : null;
            const bTimeNum = typeof b.avg_time === 'number' ? b.avg_time : null;
            const aTime = aTimeNum !== null ? aTimeNum.toFixed(2) : 'N/A';
            const bTime = bTimeNum !== null ? bTimeNum.toFixed(2) : 'N/A';

            // 決定誰較優
            let compareNote = '';
            let diff = 0;
            if (aTimeNum !== null && bTimeNum !== null) {
                diff = bTimeNum - aTimeNum; // positive => p1 faster
                if (Math.abs(diff) < 0.02) {
                    // 只略微差異
                    if (diff > 0) compareNote = `${p1Id} 整體略優於 ${p2Id}`;
                    else if (diff < 0) compareNote = `${p2Id} 整體略優於 ${p1Id}`;
                    else compareNote = `${p1Id} 與 ${p2Id} 整體相近`;
                } else {
                    if (diff > 0) compareNote = `${p1Id} 略優於 ${p2Id}`;
                    else compareNote = `${p2Id} 略優於 ${p1Id}`;
                }
            }

            const focus = `${compareNote}，可將訓練重點放在 ${ (diff>0? p2Id : p1Id) } 的短距離爆發與技術一致性上。`;
            parts.push(`選手比較： ${p1Id} 平均時間 ${aTime}s，${p2Id} 平均時間 ${bTime}s。 ${focus}`);
        }

        // 如果有外部或本地產生的綜合分析，直接顯示（通常 key 為 '綜合'）
        if (results['綜合'] && Array.isArray(results['綜合'].suggestions) && results['綜合'].suggestions.length > 0) {
            const combinedText = results['綜合'].suggestions.join('\n\n');
            parts.unshift(`綜合分析： ${combinedText}`);
        }

        // 個別建議段 - 依序選手一、選手二、綜合
        const playerKeys = ['選手一','選手二','綜合'].filter(k => results[k]);
        const p1meta = results['選手一'] ? results['選手一'].meta : null;
        const p2meta = results['選手二'] ? results['選手二'].meta : null;
        playerKeys.forEach(key => {
            const r = results[key];
            if (!r) return;
            const pid = r.playerId && r.playerId !== 'combined' ? r.playerId : '';

            // Use generatePlayerComment to create varied comments per player
            const otherMeta = (key === '選手一') ? p2meta : (key === '選手二' ? p1meta : null);
            const comment = this.generatePlayerComment(r.meta || {}, otherMeta || {}, pid || '');

            // If single player only, ensure format matches single-paragraph example
            if (playerKeys.length === 1) {
                parts.push(comment);
            } else {
                // For multi-player, label each player's comment
                if (pid) parts.push(`選手 ${pid} 建議： ${comment}`);
                else parts.push(`${key} 建議： ${comment}`);
            }
        });

        // 顯示其它非標準的欄位（優先顯示 AI一，並忽略任何系統性鍵）
        if (results['AI一'] && Array.isArray(results['AI一'].suggestions)) {
            results['AI一'].suggestions.forEach(s => parts.push(`AI一： ${s}`));
        }

        // Convert parts to HTML paragraphs and highlight numeric/key phrases
        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const htmlParts = [];
        parts.forEach(p => {
            if (!p) return;
            // split into paragraphs by double newline
            const segs = String(p).split(/\n\s*\n/);
            segs.forEach(seg => {
                let t = esc(seg.trim());

                // Highlight player IDs (simple heuristic: sequences of 2-6 digits or P-prefixed IDs)
                t = t.replace(/(P?\d{2,6})/g, '<span class="ai-key">$1</span>');

                // Highlight times like 4.20 or 12.34 (use ai-time class)
                t = t.replace(/(\d+\.\d{1,3})/g, '<span class="ai-time">$1</span>');

                // Highlight phrases like 第 X 階段
                t = t.replace(/第\s*(\d+)\s*階段/g, '第 <span class="ai-key">$1</span> 階段');

                if (t) htmlParts.push(`<p>${t}</p>`);
            });
        });

        return htmlParts.join('\n');
    }

    // 為單一選手生成多樣化優缺點與建議（可接受另一位選手的 meta 以進行比較）
    generatePlayerComment(meta, otherMeta, playerId) {
        try {
            const metrics = meta && meta.metrics ? meta.metrics : {};
            const per = meta && meta.perStageStats ? meta.perStageStats : {};

            const avgTime = typeof metrics.avg_time === 'number' ? metrics.avg_time : null;
            const avgVel = typeof metrics.avg_vel === 'number' ? metrics.avg_vel : null;
            const avgAcc = typeof metrics.avg_acc === 'number' ? metrics.avg_acc : null;

            // strengths / weaknesses
            const strengths = [];
            const weaknesses = [];

            if (avgTime !== null && otherMeta && otherMeta.metrics && typeof otherMeta.metrics.avg_time === 'number') {
                const otherTime = otherMeta.metrics.avg_time;
                if (avgTime < otherTime - 0.02) strengths.push('速度較快（秒數較短）');
                else if (avgTime > otherTime + 0.02) weaknesses.push('秒數偏長，需提升速度');
            } else if (avgTime !== null) {
                if (avgTime < 1.0) strengths.push('整體秒數較短');
                else weaknesses.push('整體秒數偏長');
            }

            if (avgVel !== null) {
                if (avgVel > 0.2) strengths.push('平均速度較高');
                else weaknesses.push('平均速度偏低');
            }

            if (avgAcc !== null) {
                if (avgAcc > 0.6) strengths.push('加速度表現不錯');
                else weaknesses.push('加速度不足，建議加強爆發力訓練');
            }

            // per-stage issues: count problem stages, find worst and best stages
            let problemCount = 0;
            let worstStage = null;
            let bestStage = null;
            Object.keys(per).forEach(s => {
                const st = per[s];
                if (!st) return;
                if (avgTime !== null && typeof st.avg_time === 'number' && typeof st.avg_vel === 'number') {
                    if (st.avg_time > avgTime && st.avg_vel < avgVel) problemCount++;
                }
                if (st && typeof st.avg_time === 'number') {
                    if (!worstStage || st.avg_time > worstStage.time) worstStage = { stage: s, time: st.avg_time };
                    if (!bestStage || st.avg_time < bestStage.time) bestStage = { stage: s, time: st.avg_time };
                }
            });

            // Summary paragraph
            const intro = `玩家 ${playerId} 概況：` +
                (avgTime !== null ? `平均時間 ${avgTime.toFixed(2)}，` : '') +
                (avgVel !== null ? `平均速度 ${avgVel.toFixed(3)}，` : '') +
                (avgAcc !== null ? `平均加速度 ${avgAcc.toFixed(3)}。` : '');

            // Prioritized issues and short suggestions (each bullet as its own paragraph)
            const bullets = [];
            // 1) time-related
            if (avgTime !== null) {
                if (avgTime > 4.0) bullets.push(`• 秒數偏長：平均 ${avgTime.toFixed(2)}s，優先目標為縮短總時間 0.1-0.3s。`);
                else bullets.push(`• 秒數表現良好：平均 ${avgTime.toFixed(2)}s，維持訓練強度並優化細節。`);
            }
            // 2) velocity / acceleration
            if (avgVel !== null) {
                if (avgVel < 0.15) bullets.push(`• 平均速度較低（${avgVel.toFixed(3)}），建議加入短距離加速與技術訓練。`);
                else bullets.push(`• 平均速度尚可（${avgVel.toFixed(3)}），可專注於一致性訓練。`);
            }
            if (avgAcc !== null) {
                if (avgAcc < 0.4) bullets.push(`• 加速度不足（${avgAcc.toFixed(3)}），建議增加力量/爆發訓練。`);
            }

            // per-stage problems
            if (problemCount > 0) {
                bullets.push(`• 發現 ${problemCount} 個階段時間高於平均且速度低於平均，建議在訓練中加入針對性的短衝與節奏練習。`);
            }

            // best/worst
            if (bestStage) bullets.push(`• 表現最佳：第 ${bestStage.stage} 階段（${bestStage.time.toFixed(2)}s）。`);
            if (worstStage) bullets.push(`• 表現最差：第 ${worstStage.stage} 階段（${worstStage.time.toFixed(2)}s），建議針對該段進行分段訓練。`);

            // Concrete drills (1-3 items)
            const drills = [];
            if (avgVel !== null && avgVel < 0.2) {
                drills.push('短距離衝刺 (6-15m) x6，間歇 90s，專注起步與加速');
            }
            if (avgAcc !== null && avgAcc < 0.5) {
                drills.push('阻力起步或負重加速訓練 4-6 組');
            }
            if (drills.length === 0) drills.push('維持目前訓練，並紀錄每次秒數以監控進展');

            // 為了讓兩位選手的輸出不一樣：
            // 1) 根據 playerId 決定一個小變體 index（若無 playerId，使用隨機）
            // 2) 使用變體決定段落模板與訓練動作抽樣
            const pool = drills.slice();
            // 若沒有 playerId，就使用隨機化；若有，產生穩定的變體值
            let variant = 0;
            if (playerId) {
                try {
                    const s = String(playerId);
                    let acc = 0;
                    for (let i = 0; i < s.length; i++) acc += s.charCodeAt(i);
                    variant = acc % 3; // 0/1/2
                } catch (e) { variant = Math.floor(Math.random() * 3); }
            } else {
                variant = Math.floor(Math.random() * 3);
            }

            // 變體模板（不同語氣與開頭）
            const introTemplates = [
                intro.trim(),
                `${intro.trim()} 簡短建議如下：`,
                `針對 ${playerId || '該選手'} 的觀察：\n${intro.trim()}`
            ];

            const bulletTemplates = [
                bullets.slice(),
                bullets.map(b => b.replace('建議', '建議 (優先)：')),
                bullets.map(b => b.replace('•', '-'))
            ];

            // 依 variant 抽取 1-3 個訓練動作
            const shuffled = this.shuffleArray(pool);
            const drillCount = Math.min(3, Math.max(1, 1 + variant));
            const selectedDrills = shuffled.slice(0, drillCount);

            // 組裝輸出
            const paras = [];
            paras.push(introTemplates[variant % introTemplates.length]);
            paras.push('建議重點：');
            bulletTemplates[variant % bulletTemplates.length].forEach(b => paras.push(b));
            paras.push(`推薦訓練動作：${selectedDrills.join('；')}`);

            // 小幅隨機化語句順序（以 playerId 為基礎避免兩位一樣）
            if (!playerId && this.randomBool(0.5)) paras.reverse();

            return paras.join('\n\n');
        } catch (e) {
            console.warn('generatePlayerComment error', e);
            return '';
        }
    }

    // 下載 JSON
    downloadAnalysisJSON(results) {
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_analysis_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // 下載 TXT
    downloadAnalysisTXT(results) {
        const txt = this.formatAISuggestionsReport(results);
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_analysis_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // 產生兩個較隨機化的 AI 評語（用於同時顯示兩個 AI 的輸出）
    generateTwoRandomAiRemarks(p1Result, p2Result) {
        // 只針對選手訓練狀況產生隨機化短語，不評價系統
        const templates = [
            (id) => `${id} 訓練狀況穩定，建議維持目前訓練並針對分段弱點做短期強化。`,
            (id) => `${id} 起跑與加速表現需要加強，建議加入阻力起步與短距離爆發訓練。`,
            (id) => `${id} 平均速度表現良好，但分段一致性不足，建議分段重複練習。`,
            (id) => `${id} 加速度略低，優先進行力量與起步技術訓練以提升爆發力。`,
            (id) => `${id} 秒數有小幅進步空間，建議在每次訓練後記錄秒數以追蹤改善。`,
            (id) => `${id} 表現波動，建議做更多短距離穩定性訓練以提升一致性。`
        ];

        const pickTemplate = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const formatId = (id) => {
            if (!id) return '選手X';
            const s = String(id).trim();
            // if purely numeric or P-prefixed numeric, show as 選手NNN
            const m = s.match(/^P?(\d+)$/i);
            if (m) return `選手${m[1]}`;
            return s;
        };

        const p1Label = formatId((p1Result && p1Result.playerId) ? p1Result.playerId : (p2Result && p2Result.playerId ? p2Result.playerId : null));
        const p2Label = formatId((p2Result && p2Result.playerId) ? p2Result.playerId : (p1Result && p1Result.playerId ? p1Result.playerId : null));

        const remarkA = pickTemplate(templates)(p1Label);
        const remarkB = pickTemplate(templates)(p2Label);
        return [remarkA, remarkB];
    }

    // 儲存分析歷史到 localStorage（保留最新 20 筆）
    saveAnalysisHistory(results) {
        try {
            const key = 'aiAnalysisHistory';
            const raw = localStorage.getItem(key);
            const arr = raw ? JSON.parse(raw) : [];
            arr.unshift({ ts: new Date().toISOString(), results });
            if (arr.length > 20) arr.length = 20;
            localStorage.setItem(key, JSON.stringify(arr));
        } catch (e) {
            console.warn('儲存 AI 分析歷史失敗:', e);
        }
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

// 已有的 testUserDataFormat() 會建立並匯入測試資料，這裡提供一個簡單封裝，讓 index.html 的按鈕呼叫同一個流程
function addTestData() {
    try {
        // 優先直接把固定測試資料加入到 window.system（若已初始化）
        const testCSV = `P_ID,Date,Stage,Time,Vel_mean,Acc_mean,P_ID2,Date,Stage,Time,Vel_mean,Acc_mean
111,122525,1,4.2,0.105005,0.377869,222,122525,1,3.96,0.186163,0.303266
111,122525,2,4.86,0.00439,0.014879,222,122525,2,4.21,0.030862,0.065613
111,122525,3,3.95,0.021117,0.615007,222,122525,3,3.91,0.030493,0.706509
111,122525,4,4.8,0.006563,0.247378,222,122525,4,4.89,0.122325,1.371797
111,122525,5,3.9,0.054284,0.556877,222,122525,5,3.84,0.145421,1.445542
111,122525,6,3.7,0.058743,0.544257,222,122525,6,4.2,0.448843,0.125454`;

        const uploadHandler = new FileUploadHandler();
        const result = uploadHandler.parseCSV(testCSV);

        if (result && Array.isArray(result.data) && result.data.length > 0 && window.system) {
            result.data.forEach(d => { window.system.addData(d); });
            if (typeof window.system.displayData === 'function') window.system.displayData();
            if (typeof window.system.updateCharts === 'function') window.system.updateCharts();
            if (typeof window.system.showMessage === 'function') window.system.showMessage('測試資料新增成功！', 'success');
            return;
        }

        // fallback: call older helper if present
        if (typeof testUserDataFormat === 'function') {
            testUserDataFormat();
            return;
        }

        console.warn('無法新增測試資料 (window.system 或 testUserDataFormat 不存在)');
    } catch (e) {
        console.error('addTestData error', e);
        if (typeof testUserDataFormat === 'function') testUserDataFormat();
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
    
    // 創建您提供的測試資料（6 行，已為逗號分隔）
    const testCSV = `P_ID,Date,Stage,Time,Vel_mean,Acc_mean,P_ID2,Date,Stage,Time,Vel_mean,Acc_mean
111,122525,1,4.2,0.105005,0.377869,222,122525,1,3.96,0.186163,0.303266
111,122525,2,4.86,0.00439,0.014879,222,122525,2,4.21,0.030862,0.065613
111,122525,3,3.95,0.021117,0.615007,222,122525,3,3.91,0.030493,0.706509
111,122525,4,4.8,0.006563,0.247378,222,122525,4,4.89,0.122325,1.371797
111,122525,5,3.9,0.054284,0.556877,222,122525,5,3.84,0.145421,1.445542
111,122525,6,3.7,0.058743,0.544257,222,122525,6,4.2,0.448843,0.125454`;

    // 已為逗號分隔，不需轉換
    const csvFormatted = testCSV;

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
