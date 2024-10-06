
document.addEventListener('DOMContentLoaded', () => {
    // 全局變量
    let svg, g, projectmethod, pathGenerator, earthquakeData;
    const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 10]);
    const tooltip = d3.select(".county-tip");
    let markerInterval;
    let previousEarthquakeData = [];
    let selectedEarthquake;
    const closeIcon = document.querySelector('.close-icon');
    const detailMobile = document.getElementById('detail-mobile');

    // 初始化函數
    function init() {
        initializeMap();
        refreshDataAndMap();
        setInterval(refreshDataAndMap, 60000);
        setupEventListeners();
    }

    // 初始化地圖
    function initializeMap() {
        svg = d3.select(".taiwan")
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", "0 0 800 600");
        g = svg.append("g");
        
        const initialScale = getInitialScale();
        projectmethod = d3.geoMercator().center([121, 23.8]).scale(initialScale);
        pathGenerator = d3.geoPath().projection(projectmethod);
    }

    // 獲取初始比例
    function getInitialScale() {
        if (window.innerWidth < 768) return 16000;
        if (window.innerWidth < 1200) return 15000;
        return 13500;
    }

    // 加載數據
    function loadData() {
        return Promise.all([
            fetchEarthquakeData(),
            fetchTaiwanMapData()
        ]);
    }

    // 獲取地震數據
    async function fetchEarthquakeData() {
        const csrfToken = await window.getCSRFToken();
        return fetch('https://api.lcwei.site/api/earthquake_data', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        })
        .then(handleResponse)
        .then(data => {
            earthquakeData = data.earthquakes;
        });
    }

    // 獲取台灣地圖數據
    function fetchTaiwanMapData() {
        return fetch('/static/json/Taiwan.json').then(handleResponse);
    }

    // 處理 API 響應
    function handleResponse(response) {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }

    // 繪製地圖
    function drawMap(mapResponse) {
        const geometries = topojson.feature(mapResponse, mapResponse.objects["Taiwan"]);

        g.selectAll("path")
            .data(geometries.features)
            .enter()
            .append("path")
            .attr("d", pathGenerator)
            .attr("class", "county")
            .attr("fill", d => getCountyFillColor(d))
            .attr("opacity", 0.5)
            .append("title");
    }

    // 獲取縣市填充顏色
    function getCountyFillColor(d) {
        if (!selectedEarthquake || !selectedEarthquake.AreaIntensity) {
            return "var(--bg2-color)";
        }
        const areaIntensity = selectedEarthquake.AreaIntensity.find(area => area.countyName === d.properties["COUNTYNAME"]);
        if (areaIntensity) {
            const intensityValue = parseInt(areaIntensity.intensity);
            return colorScale(intensityValue);
        }
        return "var(--bg2-color)";
    }

    // 處理縣市懸停事件
    function handleCountyHover(event, d, selectedEarthquake) {
        const countyName = d.properties["COUNTYNAME"];
        const areaIntensity = selectedEarthquake.AreaIntensity.find(area => area.countyName === countyName);
        const intensityValue = areaIntensity ? areaIntensity.intensity : "0";

        updateTooltipContent(countyName, intensityValue);
        positionTooltip(event);
    }

    // 更新工具提示內容
    function updateTooltipContent(countyName, intensityValue) {
        d3.select("#tooltip-county").text(countyName);
        d3.select("#tooltip-intensity").text(intensityValue + "級");
    }

    // 定位工具提示
    function positionTooltip(event) {
        const tooltipWidth = tooltip.node().offsetWidth;
        const windowWidth = window.innerWidth;
        const tooltipHeight = parseInt(tooltip.style("height"), 10);

        tooltip.style("left", () => {
            return (event.pageX + tooltipWidth + 10 > windowWidth) 
                ? `${event.pageX - tooltipWidth - 10}px` 
                : `${event.pageX + 10}px`;
        })
        .style("top", `${event.pageY - tooltipHeight - 10}px`)
        .style("visibility", "visible");
    }

    // 標記地震位置
    function markEarthquakeLocations(selectedEarthquake = earthquakeData[0]) {
        clearExistingMarkers();
        createMainMarker(selectedEarthquake);
        startMarkerCreation(selectedEarthquake);
    }

    // 清除現有標記
    function clearExistingMarkers() {
        g.selectAll(".earthquake-marker-main").remove();
        g.selectAll(".earthquake-marker").remove();
        if (markerInterval) clearInterval(markerInterval);
    }

    // 創建主標記
    function createMainMarker(earthquake) {
        g.append("circle")
            .data([earthquake])
            .attr("class", "earthquake-marker-main")
            .attr("cx", d => projectmethod([d.longitude, d.latitude])[0])
            .attr("cy", d => projectmethod([d.longitude, d.latitude])[1])
            .attr("r", 15)
            .attr("fill", "var(--sp-color)")
            .attr("stroke", "var(--font-color)")
            .attr("stroke-width", "1px")
            .attr("opacity", 0.8)
            .on('click', function(event, d) {
                onMarkerClick(d);
            });
    }

    // 開始創建標記
    function startMarkerCreation(selectedEarthquake) {
        createMarker(selectedEarthquake);
        markerInterval = setInterval(() => createMarker(selectedEarthquake), 1000);
    }

    // 創建單個標記
    function createMarker(earthquake) {
        const [x, y] = projectmethod([earthquake.longitude, earthquake.latitude]);
        
        g.append("circle")
            .attr("class", "earthquake-marker")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 15)
            .attr("fill", "var(--sp-color)")
            .attr("opacity", 0.8)
            .on('click', () => onMarkerClick(earthquake))
            .transition()
            .duration(1000)
            .attr("r", 30)
            .attr("opacity", 0)
            .ease(d3.easeCubic)
            .on("end", function() {
                d3.select(this).remove();
            });
    }

    // 更新地圖顏色
    function updateMapColors(earthquake) {
        g.selectAll("path")
            .attr("fill", d => getCountyFillColor(d, earthquake));
    }

    // 更新表格
    function updateTable() {
        const earthquakeTable = document.getElementById("earthquake-tbody");
        const mobileTableBody = document.getElementById("mobile-earthquake");
        earthquakeTable.innerHTML = "";
        mobileTableBody.innerHTML = "";
        
        selectedEarthquake = earthquakeData[0];
        updateDetailTable(selectedEarthquake);

        earthquakeData.forEach((earthquake, index) => {
            const tr = createTableRow(earthquake, index);
            const trMobile = createMobileTableRow(earthquake, index);

            addEventListenersToRow(tr, trMobile, earthquake);

            earthquakeTable.appendChild(tr);
            mobileTableBody.appendChild(trMobile);
        });
    }

    // 創建表格行
    function createTableRow(earthquake, index) {
        const tr = document.createElement("tr");
        tr.className = index === 0 ? "table-tr selected" : "table-tr";
        const spanBackgroundColor = getSpanBackgroundColor(earthquake.reportColor);
        tr.innerHTML = `
            <td id="intensity" class="table-td center">
                <span style="background-color: ${spanBackgroundColor};">${earthquake.maxIntensity}級</span>
            </td>
            <td id="info" class="table-td">
                <span class="datetime">${earthquake.originTime}</span><br>
                <span class="location">${extractLocation(earthquake.location)}</span>
            </td>
        `;
        return tr;
    }

    // 創建移動端表格行
    function createMobileTableRow(earthquake, index) {
        const trMobile = document.createElement("tr");
        trMobile.className = index === 0 ? "table-tr selected" : "table-tr";
        const spanBackgroundColor = getSpanBackgroundColor(earthquake.reportColor);
        trMobile.innerHTML = `
            <td id="mobile-intensity" class="table-td center">
                <span style="background-color: ${spanBackgroundColor};">${earthquake.maxIntensity}級</span>
            </td>
            <td id="mobile-info" class="table-td">
                <span class="mobile-datetime">${earthquake.originTime}</span><br>
                <span class="mobile-location">${extractLocation(earthquake.location)}</span>
            </td>
        `;
        return trMobile;
    }

    // 為行添加事件監聽器
    function addEventListenersToRow(tr, trMobile, earthquake) {
        tr.addEventListener('click', () => onRowClick(tr, earthquake, false));
        trMobile.addEventListener('click', () => onRowClick(trMobile, earthquake, true));
    }

    // 行點擊事件處理
    function onRowClick(row, earthquake, isMobile) {
        const selector = isMobile ? '#mobile-earthquake' : '#earthquake-tbody';
        document.querySelectorAll(`${selector} .selected`).forEach(el => el.classList.remove('selected'));
        selectedEarthquake = earthquake;
        row.classList.add('selected');

        if (isMobile) {
            toggleMobileList();
        }

        updateDetailTable(earthquake);
        markEarthquakeLocations(earthquake);
        updateMapColors(earthquake);
    }

    // 切換移動端列表顯示
    function toggleMobileList() {
        const mobileList = document.querySelector('.mobile-list');
        mobileList.style.display = mobileList.style.display === 'none' || !mobileList.style.display ? 'block' : 'none';
    }

    // 提取位置信息
    function extractLocation(locationText) {
        const match = locationText.match(/位於(.+?)\)/);
        return match ? match[1] : locationText;
    }

    // 更新詳細信息表格
    function updateDetailTable(earthquake) {
        document.getElementById("detail-no").textContent = earthquake.earthquakeNo;
        document.getElementById("detail-datetime").textContent = earthquake.originTime;
        document.getElementById("detail-location").textContent = earthquake.location;
        document.getElementById("detail-depth").textContent = earthquake.depth + " 公里";
        document.getElementById("detail-magnitude").textContent = earthquake.magnitude;
    }

    // 刷新數據和地圖
    function refreshDataAndMap() {
        loadData()
            .then(([_, mapResponse]) => {
                if (JSON.stringify(earthquakeData) !== JSON.stringify(previousEarthquakeData)) {
                    previousEarthquakeData = [...earthquakeData];
                    selectedEarthquake = earthquakeData[0]; // 設置選定的地震
                    drawMap(mapResponse);
                    markEarthquakeLocations();
                    updateMapHoverEvents();
                    updateTable();
                }
            })
            .catch(error => console.error("Error loading data:", error));
    }

    // 更新地圖懸停事件
    function updateMapHoverEvents() {
        g.selectAll(".county")
            .on("mouseover", (event, d) => handleCountyHover(event, d, selectedEarthquake))
            .on("mousemove", (event, d) => handleCountyHover(event, d, selectedEarthquake))
            .on("mouseout", () => tooltip.style("visibility", "hidden"));
    }

    // 隱藏移動端詳細信息
    function hideDetailMobile() {
        detailMobile.style.display = 'none';
    }

    // 標記點擊事件處理
    function onMarkerClick(earthquake) {
        updateMobileDetail(earthquake);
        document.getElementById('detail-mobile').style.display = 'table';
    }

    // 更新移動端詳細信息
    function updateMobileDetail(earthquake) {
        document.getElementById('mobile-no').textContent = earthquake.earthquakeNo || '未知';
        document.getElementById('mobile-datetime').textContent = earthquake.originTime || '未知';
        document.getElementById('mobile-location').textContent = earthquake.location || '未知';
        document.getElementById('mobile-depth').textContent = (earthquake.depth || '未知') + " 公里";
        document.getElementById('mobile-magnitude').textContent = earthquake.magnitude || '未知';
    }

    // 設置事件監聽器
    function setupEventListeners() {
        closeIcon.addEventListener('click', hideDetailMobile);

        document.querySelector('.mobile-title').addEventListener('click', () => {
            toggleMobileList();
            hideDetailMobile();
        });
    }

    // 獲取震度背景顏色
    function getSpanBackgroundColor(reportColor) {
        const colorMap = {
            "綠色": "var(--earthquake-span-4)",
            "黃色": "var(--earthquake-span-3)",
            "橙色": "var(--earthquake-span-2)",
            "紅色": "var(--earthquake-span-1)"
        };
        return colorMap[reportColor] || "var(--default-color)";
    }

    // 啟動應用程序
    init();
});