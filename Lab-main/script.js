// 選手敏捷度分析系統主要邏輯
class AgilityAnalysisSystem {
    constructor() {
        this.data = this.loadData();
        this.player1Chart = null;
        this.player2Chart = null;
        this.initializeSystem();
    }

    // 初始化系統
    initializeSystem() {
        this.setupEventListeners();
        this.displayData();
        this.initializeCharts();
        console.log('系統初始化完成');
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 表單提交
        const dataForm = document.getElementById('dataForm');
        if (dataForm) {
            dataForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // 檔案選擇按鈕
        const selectFileBtn = document.getElementById('selectFileBtn');
        const fileInput = document.getElementById('fileInput');
        const fileDropZone = document.getElementById('fileDropZone');

        if (selectFileBtn && fileInput) {
            selectFileBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // 拖拽檔案
        if (fileDropZone) {
            fileDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            fileDropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            fileDropZone.addEventListener('drop', (e) => this.handleFileDrop(e));
            fileDropZone.addEventListener('click', () => fileInput.click());
        }
    }

    // 處理表單提交
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            p_id: document.getElementById('p_id').value,
            date: document.getElementById('date').value,
            stage: parseInt(document.getElementById('stage').value),
            time: parseFloat(document.getElementById('time').value),
            vel_mean: parseFloat(document.getElementById('vel_mean').value),
            acc_mean: parseFloat(document.getElementById('acc_mean').value)
        };

        if (this.validateData(formData)) {
            this.addData(formData);
            this.displayData();
            this.updateCharts();
            document.getElementById('dataForm').reset();
            this.showMessage('資料新增成功！', 'success');
        }
    }

    // 驗證資料
    validateData(data) {
        if (!data.p_id || !data.date || !data.stage || !data.time || !data.vel_mean || !data.acc_mean) {
            this.showMessage('請填入所有必要欄位', 'error');
            return false;
        }

        if (data.stage < 0 || data.time < 0) {
            this.showMessage('階段和時間必須為正數', 'error');
            return false;
        }

        return true;
    }

    // 新增資料
    addData(newData) {
        newData.id = Date.now(); // 添加唯一ID
        this.data.push(newData);
        this.saveData();
    }

    // 刪除資料
    deleteData(id) {
        if (confirm('確定要刪除這筆資料嗎？')) {
            this.data = this.data.filter(item => item.id !== id);
            this.saveData();
            this.displayData();
            this.updateCharts();
            this.showMessage('資料刪除成功！', 'success');
        }
    }

    // 一鍵清空所有資料
    clearAllData() {
        if (this.data.length === 0) {
            this.showMessage('目前沒有資料可以清除', 'info');
            return;
        }

        const confirmMessage = `確定要刪除所有 ${this.data.length} 筆資料嗎？\n\n此操作無法復原！`;
        
        if (confirm(confirmMessage)) {
            // 雙重確認
            if (confirm('再次確認：真的要清空所有資料嗎？')) {
                this.data = [];
                this.saveData();
                this.displayData();
                this.updateCharts();
                this.showMessage('所有資料已清空！', 'success');
            }
        }
    }

    // 選擇性刪除（按條件刪除）
    deleteByCondition(condition) {
        const originalCount = this.data.length;
        
        switch (condition) {
            case 'player':
                const playerId = prompt('請輸入要刪除的選手ID (P_ID):');
                if (playerId) {
                    this.data = this.data.filter(item => item.p_id !== playerId.trim());
                }
                break;
                
            case 'date':
                const date = prompt('請輸入要刪除的日期 (YYYY-MM-DD):');
                if (date) {
                    this.data = this.data.filter(item => item.date !== date.trim());
                }
                break;
                
            case 'stage':
                const stage = prompt('請輸入要刪除的階段 (Stage):');
                if (stage && !isNaN(stage)) {
                    this.data = this.data.filter(item => item.stage !== parseInt(stage));
                }
                break;
                
            default:
                this.showMessage('未知的刪除條件', 'error');
                return;
        }
        
        const deletedCount = originalCount - this.data.length;
        
        if (deletedCount > 0) {
            this.saveData();
            this.displayData();
            this.updateCharts();
            this.showMessage(`成功刪除 ${deletedCount} 筆資料`, 'success');
        } else {
            this.showMessage('沒有找到符合條件的資料', 'info');
        }
    }

    // 顯示資料表格
    displayData() {
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (this.data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #7f8c8d;">暫無資料</td></tr>';
            return;
        }

        this.data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="row-checkbox" value="${item.id}" onchange="system.updateDeleteButton()">
                </td>
                <td>${item.p_id}</td>
                <td>${item.date}</td>
                <td>${item.stage}</td>
                <td>${item.time.toFixed(2)}</td>
                <td>${item.vel_mean.toFixed(6)}</td>
                <td>${item.acc_mean.toFixed(6)}</td>
                <td>
                    <button class="delete-btn" onclick="system.deleteData(${item.id})">
                        刪除
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        this.updateDeleteButton();
    }

    // 更新批量刪除按鈕狀態
    updateDeleteButton() {
        const checkboxes = document.querySelectorAll('.row-checkbox:checked');
        const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        const selectAllBtn = document.getElementById('selectAllBtn');
        
        if (deleteSelectedBtn) {
            deleteSelectedBtn.disabled = checkboxes.length === 0;
            deleteSelectedBtn.textContent = checkboxes.length > 0 
                ? `🗑️ 刪除選中的 ${checkboxes.length} 筆` 
                : '🗑️ 刪除選中項目';
        }

        if (selectAllBtn) {
            const allCheckboxes = document.querySelectorAll('.row-checkbox');
            selectAllBtn.textContent = checkboxes.length === allCheckboxes.length && allCheckboxes.length > 0
                ? '❌ 取消全選'
                : '☑️ 全選';
        }
    }

    // 全選/取消全選
    toggleSelectAll() {
        const allCheckboxes = document.querySelectorAll('.row-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        const shouldSelectAll = checkedCheckboxes.length !== allCheckboxes.length;

        allCheckboxes.forEach(checkbox => {
            checkbox.checked = shouldSelectAll;
        });

        this.updateDeleteButton();
    }

    // 刪除選中的資料
    deleteSelectedData() {
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        
        if (checkedCheckboxes.length === 0) {
            this.showMessage('請先選擇要刪除的資料', 'warning');
            return;
        }

        const selectedIds = Array.from(checkedCheckboxes).map(cb => parseInt(cb.value));
        const confirmMessage = `確定要刪除選中的 ${selectedIds.length} 筆資料嗎？`;

        if (confirm(confirmMessage)) {
            this.data = this.data.filter(item => !selectedIds.includes(item.id));
            this.saveData();
            this.displayData();
            this.updateCharts();
            this.showMessage(`成功刪除 ${selectedIds.length} 筆資料`, 'success');
        }
    }

    // 初始化圖表
    initializeCharts() {
        this.initializePlayerChart('player1Chart', 'player1Chart');
        this.initializePlayerChart('player2Chart', 'player2Chart');
        this.updateCharts();
    }

    // 初始化單個選手圖表
    initializePlayerChart(canvasId, chartProperty) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const isPlayer1 = canvasId === 'player1Chart';
        const playerColor = isPlayer1 ? '#3498db' : '#e74c3c';
        const playerBgColor = isPlayer1 ? 'rgba(52, 152, 219, 0.1)' : 'rgba(231, 76, 60, 0.1)';

        this[chartProperty] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '資料',
                    data: [],
                    borderColor: playerColor,
                    backgroundColor: playerBgColor,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: isPlayer1 ? '選手1 資料分析' : '選手2 資料分析'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: '數值'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '位置'
                        }
                    }
                }
            }
        });
    }

    // 更新圖表
    updateCharts() {
        if (this.data.length === 0) return;

        // 獲取所有唯一的選手ID
        const playerIds = [...new Set(this.data.map(item => item.p_id))].sort();
        
        // 更新圖表標題
        this.updateChartTitles(playerIds);
        
        // 分別更新兩個選手的圖表
        if (playerIds.length > 0) {
            this.updatePlayerChart(this.player1Chart, playerIds[0], 'player1Title');
        }
        
        if (playerIds.length > 1) {
            this.updatePlayerChart(this.player2Chart, playerIds[1], 'player2Title');
        } else {
            // 如果只有一個選手，清空第二個圖表
            this.clearChart(this.player2Chart);
            document.getElementById('player2Title').textContent = '選手2 數據圖表 (無數據)';
        }
    }

    // 更新圖表標題
    updateChartTitles(playerIds) {
        const player1Title = document.getElementById('player1Title');
        const player2Title = document.getElementById('player2Title');
        
        if (player1Title) {
            player1Title.textContent = playerIds.length > 0 ? 
                `選手 ${playerIds[0]} 數據圖表` : '選手1 數據圖表 (無數據)';
        }
        
        if (player2Title) {
            player2Title.textContent = playerIds.length > 1 ? 
                `選手 ${playerIds[1]} 數據圖表` : '選手2 數據圖表 (無數據)';
        }
    }

    // 更新單個選手圖表
    updatePlayerChart(chart, playerId, titleId) {
        if (!chart || !playerId) return;

        const chartType = document.getElementById('chartType').value;
        
        // 篩選該選手的數據並按階段排序
        const playerData = this.data
            .filter(item => item.p_id === playerId)
            .sort((a, b) => a.stage - b.stage);

        let labels = [];
        let data = [];
        let label = '';

        switch (chartType) {
            case 'time':
                labels = playerData.map(item => `位置${item.stage}`);
                data = playerData.map(item => item.time);
                label = '時間 (秒)';
                break;
            case 'velocity':
                labels = playerData.map(item => `位置${item.stage}`);
                data = playerData.map(item => item.vel_mean);
                label = '平均速度';
                break;
            case 'acceleration':
                labels = playerData.map(item => `位置${item.stage}`);
                data = playerData.map(item => item.acc_mean);
                label = '平均加速度';
                break;
        }

        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].label = label;
        chart.update();
    }

    // 清空圖表
    clearChart(chart) {
        if (!chart) return;
        
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.data.datasets[0].label = '無數據';
        chart.update();
    }

    // 處理檔案選擇
    handleFileSelect(e) {
        const files = e.target.files;
        this.processFiles(files);
    }

    // 處理拖拽
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('fileDropZone').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('fileDropZone').classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('fileDropZone').classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        this.processFiles(files);
    }

    // 處理檔案
    processFiles(files) {
        if (files.length === 0) return;

        Array.from(files).forEach(file => {
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.csv')) {
                // 使用新的上傳處理器
                if (window.fileUploadHandler) {
                    window.fileUploadHandler.readCSVFile(file);
                } else {
                    this.readCSVFile(file);
                }
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                if (window.fileUploadHandler) {
                    window.fileUploadHandler.processExcelFile(file).then(result => {
                        this.handleUploadResult(result, file.name);
                    }).catch(error => {
                        this.showMessage(`Excel檔案處理錯誤: ${error.message}`, 'error');
                    });
                } else {
                    this.readExcelFile(file);
                }
            } else {
                this.showMessage(`不支援的檔案格式: ${file.name}`, 'error');
            }
        });
    }

    // 處理上傳結果
    handleUploadResult(result, fileName) {
        if (result.data.length > 0) {
            result.data.forEach(data => {
                this.addData(data);
            });
            this.displayData();
            this.updateCharts();
        }

        let message = `${fileName}: 成功匯入 ${result.validRows} 筆資料`;
        if (result.errors.length > 0) {
            message += `，${result.errors.length} 筆資料有問題`;
            console.warn('匯入錯誤:', result.errors);
        }

        this.showMessage(message, result.validRows > 0 ? 'success' : 'error');
    }

    // 讀取CSV檔案（備用方法）
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
                
                const lines = csv.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim());
                
                console.log('檢測到的標題:', headers);
                
                // 檢查是否有重複的欄位組合（如P_ID和P_ID2）
                const hasMultiplePlayerSets = headers.includes('P_ID2') || headers.includes('p_id2');
                
                let importedCount = 0;
                const errors = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const values = line.split(',').map(v => v.trim());
                    
                    try {
                        if (hasMultiplePlayerSets && values.length >= 12) {
                            // 處理雙選手資料格式
                            const player1Data = {
                                p_id: values[0] || '',
                                date: this.formatDate(values[1] || ''),
                                stage: parseInt(values[2]) || 0,
                                time: parseFloat(values[3]) || 0,
                                vel_mean: parseFloat(values[4]) || 0,
                                acc_mean: parseFloat(values[5]) || 0
                            };

                            const player2Data = {
                                p_id: values[6] || '',
                                date: this.formatDate(values[7] || ''),
                                stage: parseInt(values[8]) || 0,
                                time: parseFloat(values[9]) || 0,
                                vel_mean: parseFloat(values[10]) || 0,
                                acc_mean: parseFloat(values[11]) || 0
                            };

                            if (this.validateData(player1Data)) {
                                this.addData(player1Data);
                                importedCount++;
                            }

                            if (this.validateData(player2Data)) {
                                this.addData(player2Data);
                                importedCount++;
                            }

                        } else if (values.length >= 6) {
                            // 處理單一選手資料格式
                            const data = {
                                p_id: values[0] || '',
                                date: this.formatDate(values[1] || ''),
                                stage: parseInt(values[2]) || 0,
                                time: parseFloat(values[3]) || 0,
                                vel_mean: parseFloat(values[4]) || 0,
                                acc_mean: parseFloat(values[5]) || 0
                            };

                            if (this.validateData(data)) {
                                this.addData(data);
                                importedCount++;
                            }
                        }
                    } catch (error) {
                        errors.push(`第 ${i + 1} 行錯誤: ${error.message}`);
                    }
                }
                
                this.displayData();
                this.updateCharts();
                
                let message = `成功匯入 ${importedCount} 筆資料`;
                if (errors.length > 0) {
                    message += `，${errors.length} 筆資料有問題`;
                    console.warn('匯入錯誤:', errors);
                }
                
                this.showMessage(message, 'success');
                
            } catch (error) {
                console.error('CSV檔案讀取錯誤:', error);
                this.showMessage('CSV檔案讀取錯誤: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    // 格式化日期（處理20725這種格式）
    formatDate(dateString) {
        if (!dateString) return '';
        
        const str = dateString.toString().trim();
        
        // 如果已經是標準格式，直接返回
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
        }
        
        // 處理20725這種格式
        if (str.length === 5 && /^\d{5}$/.test(str)) {
            // 假設格式是20725 = 2025年7月25日
            if (str.startsWith('207')) {
                const month = str.substring(2, 3); // 7
                const day = str.substring(3); // 25
                return `2025-0${month}-${day.padStart(2, '0')}`;
            }
        }
        
        // 返回原始字符串
        return dateString;
    }

    // 讀取Excel檔案
    readExcelFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                let importedCount = 0;
                
                jsonData.forEach(row => {
                    const data = {
                        p_id: row['P_ID'] || row['p_id'] || '',
                        date: row['Date'] || row['date'] || '',
                        stage: parseInt(row['Stage'] || row['stage']) || 0,
                        time: parseFloat(row['Time'] || row['time']) || 0,
                        vel_mean: parseFloat(row['Vel_mean'] || row['vel_mean']) || 0,
                        acc_mean: parseFloat(row['Acc_mean'] || row['acc_mean']) || 0
                    };
                    
                    if (this.validateData(data)) {
                        this.addData(data);
                        importedCount++;
                    }
                });
                
                this.displayData();
                this.updateCharts();
                this.showMessage(`成功匯入 ${importedCount} 筆資料`, 'success');
                
            } catch (error) {
                this.showMessage('Excel檔案讀取錯誤: ' + error.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // 匯出指定選手圖表為PNG檔案
    exportPlayerChartToPNG(playerNumber) {
        const chart = playerNumber === 1 ? this.player1Chart : this.player2Chart;
        const canvasId = playerNumber === 1 ? 'player1Chart' : 'player2Chart';
        
        if (!chart) {
            this.showMessage(`選手${playerNumber}圖表未初始化，無法匯出`, 'error');
            return;
        }

        if (this.data.length === 0) {
            this.showMessage('無資料可匯出圖表', 'error');
            return;
        }

        // 獲取該選手的數據
        const playerIds = [...new Set(this.data.map(item => item.p_id))].sort();
        const playerId = playerIds[playerNumber - 1];
        
        if (!playerId) {
            this.showMessage(`沒有選手${playerNumber}的數據`, 'error');
            return;
        }

        try {
            // 取得今天的日期作為檔案名
            const today = new Date();
            const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD格式
            const chartType = document.getElementById('chartType').value;
            
            let chartTypeText = '';
            switch (chartType) {
                case 'time':
                    chartTypeText = '時間變化';
                    break;
                case 'velocity':
                    chartTypeText = '速度變化';
                    break;
                case 'acceleration':
                    chartTypeText = '加速度變化';
                    break;
                default:
                    chartTypeText = '資料分析';
            }

            const fileName = `選手${playerId}_${chartTypeText}_${dateString}.png`;

            // 使用Chart.js的toBase64Image方法取得圖表圖片
            const imageURL = chart.toBase64Image('image/png', 1.0);

            // 創建下載連結
            const link = document.createElement('a');
            link.download = fileName;
            link.href = imageURL;
            
            // 觸發下載
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showMessage(`選手${playerId}圖表PNG檔案匯出成功: ${fileName}`, 'success');
            
        } catch (error) {
            console.error('圖表匯出錯誤:', error);
            this.showMessage('圖表匯出失敗: ' + error.message, 'error');
        }
    }

    // 匯出所有圖表為PNG檔案（合併版本）
    exportAllChartsToPNG() {
        if (this.data.length === 0) {
            this.showMessage('無資料可匯出圖表', 'error');
            return;
        }

        const playerIds = [...new Set(this.data.map(item => item.p_id))].sort();
        
        if (playerIds.length === 0) {
            this.showMessage('沒有選手數據', 'error');
            return;
        }

        // 創建合併的canvas
        this.exportMergedChartsToPNG();
    }

    // 匯出合併的圖表
    exportMergedChartsToPNG() {
        const chartType = document.getElementById('chartType').value;
        let chartTypeText = '';
        switch(chartType) {
            case 'time': chartTypeText = '時間變化'; break;
            case 'velocity': chartTypeText = '速度變化'; break;
            case 'acceleration': chartTypeText = '加速度變化'; break;
        }

        // 創建一個大的canvas來合併兩個圖表
        const mergedCanvas = document.createElement('canvas');
        const ctx = mergedCanvas.getContext('2d');
        
        // 設置合併canvas的尺寸 (間距與條件刪除按鈕保持一致的比例)
        const chartWidth = 650;  // 圖表寬度
        const chartHeight = 320; // 圖表高度
        const titleHeight = 100; // 標題高度
        const padding = 60;      // 邊距
        const centerGap = 60;    // 調整為適中的間距，與UI設計一致
        
        mergedCanvas.width = chartWidth * 2 + padding * 2 + centerGap;
        mergedCanvas.height = chartHeight + titleHeight + padding * 2;
        
        // 設置背景色
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);
        
        // 添加總標題
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 32px Microsoft YaHei, sans-serif';
        ctx.textAlign = 'center';
        const title = `選手敏捷度分析 - ${chartTypeText}`;
        ctx.fillText(title, mergedCanvas.width / 2, 55);
        
        // 獲取兩個圖表的canvas
        const player1Canvas = document.getElementById('player1Chart');
        const player2Canvas = document.getElementById('player2Chart');
        
        if (!player1Canvas || !player2Canvas) {
            this.showMessage('圖表尚未初始化', 'error');
            return;
        }

        // 繪製選手1圖表
        ctx.drawImage(player1Canvas, padding, titleHeight + padding, chartWidth, chartHeight);
        
        // 繪製選手2圖表
        ctx.drawImage(player2Canvas, padding + chartWidth + centerGap, titleHeight + padding, chartWidth, chartHeight);
        
        // 在兩個圖表之間添加分隔線
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        const separatorX = padding + chartWidth + centerGap / 2;
        ctx.beginPath();
        ctx.moveTo(separatorX, titleHeight + padding - 20);
        ctx.lineTo(separatorX, titleHeight + padding + chartHeight + 20);
        ctx.stroke();
        ctx.setLineDash([]); // 重置線條樣式
        
        // 添加選手標籤
        ctx.fillStyle = '#666666';
        ctx.font = 'bold 20px Microsoft YaHei, sans-serif';
        ctx.textAlign = 'center';
        
        const playerIds = [...new Set(this.data.map(item => item.p_id))].sort();
        const player1Label = playerIds[0] || '選手1';
        const player2Label = playerIds[1] || '選手2';
        
        ctx.fillText(player1Label, padding + chartWidth / 2, titleHeight + padding - 15);
        ctx.fillText(player2Label, padding + chartWidth + centerGap + chartWidth / 2, titleHeight + padding - 15);
        
        // 轉換為圖片並下載
        const link = document.createElement('a');
        link.download = `選手敏捷度分析_${chartTypeText}_${this.getCurrentDate()}.png`;
        link.href = mergedCanvas.toDataURL('image/png', 1.0);
        link.click();
        
        this.showMessage(`已匯出合併圖表: ${link.download}`, 'success');
    }

    // 獲取當前日期字符串
    getCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // 舊版本匯出功能（保持兼容性）
    exportChartToPNG() {
        this.exportAllChartsToPNG();
    }

    // 顯示訊息
    showMessage(message, type) {
        // 移除現有訊息
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // 創建新訊息
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // 插入到容器頂部
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        // 3秒後自動移除
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // 載入資料
    loadData() {
        try {
            const savedData = localStorage.getItem('agilityData');
            return savedData ? JSON.parse(savedData) : [];
        } catch (error) {
            console.error('載入資料錯誤:', error);
            return [];
        }
    }

    // 儲存資料
    saveData() {
        try {
            localStorage.setItem('agilityData', JSON.stringify(this.data));
        } catch (error) {
            console.error('儲存資料錯誤:', error);
            this.showMessage('資料儲存失敗', 'error');
        }
    }
}

// 全域函數
function updateCharts() {
    if (window.system) {
        window.system.updateCharts();
    }
}

// 舊函數保持兼容性
function updateChart() {
    updateCharts();
}

// 匯出選手1圖表為PNG
function exportPlayer1ChartToPNG() {
    if (window.system) {
        window.system.exportPlayerChartToPNG(1);
    }
}

// 匯出選手2圖表為PNG
function exportPlayer2ChartToPNG() {
    if (window.system) {
        window.system.exportPlayerChartToPNG(2);
    }
}

// 匯出所有圖表為PNG
function exportAllChartsToPNG() {
    if (window.system) {
        window.system.exportAllChartsToPNG();
    }
}

// 舊函數保持兼容性
function exportChartToPNG() {
    exportAllChartsToPNG();
}

// 一鍵清空所有資料
function clearAllData() {
    if (window.system) {
        window.system.clearAllData();
    }
}

// 選擇性刪除資料
function deleteByPlayer() {
    if (window.system) {
        window.system.deleteByCondition('player');
    }
}

function deleteByDate() {
    if (window.system) {
        window.system.deleteByCondition('date');
    }
}

function deleteByStage() {
    if (window.system) {
        window.system.deleteByCondition('stage');
    }
}

// 全選/取消全選
function toggleSelectAll() {
    if (window.system) {
        window.system.toggleSelectAll();
    }
}

// 刪除選中的資料
function deleteSelectedData() {
    if (window.system) {
        window.system.deleteSelectedData();
    }
}

// 測試函數
function addTestData() {
    if (window.system) {
        const testData = [
            { p_id: 'P001', date: '2024-01-15', stage: 1, time: 10.5, vel_mean: 2.345678, acc_mean: 1.234567 },
            { p_id: 'P001', date: '2024-01-15', stage: 2, time: 11.2, vel_mean: 2.456789, acc_mean: 1.345678 },
            { p_id: 'P002', date: '2024-01-16', stage: 1, time: 9.8, vel_mean: 2.567890, acc_mean: 1.456789 },
            { p_id: 'P002', date: '2024-01-16', stage: 2, time: 10.1, vel_mean: 2.678901, acc_mean: 1.567890 }
        ];

        testData.forEach(data => {
            window.system.addData(data);
        });

        window.system.displayData();
        window.system.updateCharts();
        window.system.showMessage('測試資料新增成功！', 'success');
    }
}

// 當頁面載入完成時初始化系統
document.addEventListener('DOMContentLoaded', function() {
    window.system = new AgilityAnalysisSystem();
});
