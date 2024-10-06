<template>
    <div id="main" class="main">
        <table v-if="isMobile" id="mobile-table" class="post-table mobile-table">
            <thead class="table-header mobile-title" @click="toggleMobileList">
                <tr class="table-tr">
                    <th class="table-th center" colspan="2">
                        臺灣近期地震列表
                        <iconify-icon icon="mdi:filter-menu" class="icon"></iconify-icon>
                    </th>
                </tr>
            </thead>
            <tbody id="mobile-earthquake" :class="['table-body mobile-list', { show: isMobileListVisible }]">
                <tr v-for="(earthquake, index) in earthquakeData" 
                    :key="earthquake.earthquakeNo" 
                    :class="['table-tr', { selected: earthquake === selectedEarthquake }]" 
                    @click="selectEarthquake(index), toggleMobileList">
                    <td class="table-td center intensity-td">
                        <span 
                            :class="['intensity', getIntensityClass(earthquake.reportColor)]">
                            {{ earthquake.intensity || '未知' }}
                        </span>
                    </td>
                    <td class="table-td">
                        <span class="datetime">{{ earthquake.datetime }}</span><br>
                        <span class="location">{{ extractLocation(earthquake.location) }}</span>
                    </td>
                </tr>
            </tbody>
        </table> 
        <div class="map-container">
            <svg class="taiwan"></svg>
        </div>
        <div v-if="!isMobile" class="info-container">
            <table id="detail-table" class="post-table detail">
                <thead class="table-header">
                <tr class="table-tr">
                    <th class="table-th center" colspan="2">詳細資訊</th>
                </tr>
                </thead>
                <tbody class="table-body">
                <tr class="table-tr">
                    <td class="table-td center">編號</td>
                    <td class="table-td">{{ selectedEarthquake?.earthquakeNo || '未知' }}</td>
                </tr>
                <tr class="table-tr">
                    <td class="table-td center">時間</td>
                    <td class="table-td">{{ selectedEarthquake?.datetime || '未知' }}</td>
                </tr>
                <tr class="table-tr">
                    <td class="table-td center">震央</td>
                    <td class="table-td">{{ selectedEarthquake?.location || '未知' }}</td>
                </tr>
                <tr class="table-tr">
                    <td class="table-td center">深度</td>
                    <td class="table-td">{{ selectedEarthquake?.depth || '未知' }}</td>
                </tr>
                <tr class="table-tr">
                    <td class="table-td center">芮氏規模</td>
                    <td class="table-td">{{ selectedEarthquake?.magnitude || '未知' }}</td>
                </tr>
                </tbody>
            </table>
            <table id="earthquake-table" class="post-table earthquake">
                <thead class="table-header">
                <tr class="table-tr">
                    <th class="table-th center" colspan="2">臺灣近期地震列表</th>
                </tr>
                </thead>
                <tbody class="table-body">
                <tr v-for="(earthquake, index) in earthquakeData" 
                    :key="earthquake.earthquakeNo" 
                    :class="['table-tr', { selected: earthquake === selectedEarthquake }]" 
                    @click="selectEarthquake(index)"
                    :data-id="earthquake.earthquakeNo">
                    <td class="table-td center intensity-td">
                        <span 
                            :class="['intensity', getIntensityClass(earthquake.reportColor)]">
                            {{ earthquake.intensity || '未知' }}
                        </span>
                    </td>
                    <td class="table-td">
                        <span class="datetime">{{ earthquake.datetime }}</span><br>
                        <span class="location">{{ extractLocation(earthquake.location) }}</span>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
        <div v-if="showDetailModal" class="detail-modal">
            <div class="modal-content">
                <table class="post-table detail">
                    <thead class="table-header">
                        <tr class="table-tr">
                            <th class="table-th center" colspan="2">
                                詳細資訊
                                <button @click="showDetailModal = false" class="close-button">
                                    <iconify-icon icon="fluent-emoji-high-contrast:cross-mark" class="close-icon"></iconify-icon>
                                </button>
                            </th>
                            
                        </tr>
                    </thead>
                    <tbody class="table-body">
                        <tr class="table-tr">
                            <td class="table-td center">編號</td>
                            <td class="table-td">{{ selectedEarthquake?.earthquakeNo || '未知' }}</td>
                        </tr>
                        <tr class="table-tr">
                            <td class="table-td center">時間</td>
                            <td class="table-td">{{ selectedEarthquake?.datetime || '未知' }}</td>
                        </tr>
                        <tr class="table-tr">
                            <td class="table-td center">震央</td>
                            <td class="table-td">{{ selectedEarthquake?.location || '未知' }}</td>
                        </tr>
                        <tr class="table-tr">
                            <td class="table-td center">深度</td>
                            <td class="table-td">{{ selectedEarthquake?.depth || '未知' }}</td>
                        </tr>
                        <tr class="table-tr">
                            <td class="table-td center">芮氏規模</td>
                            <td class="table-td">{{ selectedEarthquake?.magnitude || '未知' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>  
    <div class="county-tip">
        <span id="tooltip-county"></span>
        <span id="tooltip-intensity"></span>
    </div>
</template>

<script>
    import { ref, onMounted, onBeforeUnmount } from 'vue';
    import * as d3 from 'd3';
    import * as topojson from 'topojson-client';
    import taiwanMapData from '@/assets/Taiwan.json';

    export default {
    setup() {
        const earthquakeData = ref([]);
        const selectedEarthquake = ref(null);
        const isMobile = ref(window.innerWidth < 768);
        const isMobileListVisible = ref(false);
        const showDetailModal = ref(false);
        let svg, g, projectmethod, pathGenerator;
        const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 10]);

        // 中文顏色到 class 名稱的映射
        const colorToClassMap = {
        '綠色': 'lv-1',
        '黃色': 'lv-2',
        '橙色': 'lv-3',
        '紅色': 'lv-4'
        };

        // 根據 reportColor 返回對應的 class 名稱
        function getIntensityClass(reportColor) {
        return colorToClassMap[reportColor] || '';
        }

        function handleResize() {
            isMobile.value = window.innerWidth < 768;
        }

        onMounted(() => {
            window.addEventListener('resize', handleResize);
            initializeMap();
            refreshDataAndMap();
            setInterval(refreshDataAndMap, 60000);
        });

        onBeforeUnmount(() => {
            window.removeEventListener('resize', handleResize);
        });

        function initializeMap() {
        svg = d3.select(".taiwan")
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", "0 0 800 600");
        g = svg.append("g");

        const initialScale = getInitialScale();
        projectmethod = d3.geoMercator().center([121, 23.8]).scale(initialScale);
        pathGenerator = d3.geoPath().projection(projectmethod);

        const features = topojson.feature(taiwanMapData, taiwanMapData.objects.Taiwan).features;
        g.selectAll("path")
            .data(features)
            .enter()
            .append("path")
            .attr("d", pathGenerator)
            .attr("class", "county") // 確保這裡有正確的類別
            .attr("fill", "var(--bg2-color)") // 初始顏色
            .attr("stroke", "var(--font-color)")
            .attr("opacity", 0.5)
            .on("mouseover", (event, d) => handleCountyHover(event, d))
            .on("mousemove", (event) => positionTooltip(event))
            .on("mouseout", (event, d) => handleCountyMouseOut(event, d));
        }

        function drawMap(selectedEarthquake) {
        const features = topojson.feature(taiwanMapData, taiwanMapData.objects.Taiwan).features;
        const paths = g.selectAll("path")
            .data(features);

        paths.attr("fill", d => getCountyFillColor(d, selectedEarthquake));
        }

        function getInitialScale() {
        if (window.innerWidth < 768) return 16000;
        if (window.innerWidth < 1200) return 15000;
        return 15000;
        }

        async function fetchEarthquakeData() {
        try {
            const response = await fetch('https://api.lcwei.site/api/earthquake_data', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
            });
            const data = await response.json();
            earthquakeData.value = data.earthquakes.map(eq => ({
            ...eq,
            intensity: eq.maxIntensity + "級",
            datetime: eq.originTime
            }));
            if (earthquakeData.value.length > 0) {
            selectEarthquake(0);
            }
        } catch (error) {
            console.error("Error fetching earthquake data:", error);
        }
        }

        function refreshDataAndMap() {
        fetchEarthquakeData().then(() => {
            if (earthquakeData.value.length > 0) {
            selectedEarthquake.value = earthquakeData.value[0];
            markEarthquakeLocations(selectedEarthquake.value);
            drawMap(selectedEarthquake.value);
            }
        });
        }

        function markEarthquakeLocations(selected) {
        clearExistingMarkers();
        createMainMarker(selected);
        }

        function clearExistingMarkers() {
        g.selectAll(".earthquake-marker-main").remove();
        }

        function createMainMarker(earthquake) {
        // 清除現有的地震標記和擴散效果
        g.selectAll(".earthquake-marker-main").remove();
        g.selectAll(".earthquake-radar").remove();

        // 擴散效果的圓
        const radar = g.append("circle")
            .data([earthquake])
            .attr("class", "earthquake-radar")
            .attr("cx", d => projectmethod([d.longitude, d.latitude])[0])
            .attr("cy", d => projectmethod([d.longitude, d.latitude])[1])
            .attr("r", 15)
            .attr("fill", "var(--sp-color)")
            .attr("opacity", 0.5);

        // 固定的地震標記
        const marker = g.append("circle")
            .data([earthquake])
            .attr("class", "earthquake-marker-main")
            .attr("cx", d => projectmethod([d.longitude, d.latitude])[0])
            .attr("cy", d => projectmethod([d.longitude, d.latitude])[1])
            .attr("r", 15)
            .attr("fill", "var(--sp-color)")
            .attr("stroke", "var(--font-color)")
            .attr("stroke-width", "1px")
            .attr("opacity", 0.8)
            .on("click", () => {
                if (isMobile.value) {
                    selectedEarthquake.value = earthquake;
                    showDetailModal.value = true;
                }
            });

        // 添加雷達擴散效果
        function animateRadar() {
            radar.transition()
            .duration(1000)
            .attr("r", 30)
            .attr("opacity", 0)
            .on("end", () => {
                radar.attr("r", 15)
                    .attr("opacity", 0.5);
                animateRadar();
            });
        }

        animateRadar();
        }

        function selectEarthquake(index) {
        const earthquake = earthquakeData.value[index];
        if (!earthquake) return;

        selectedEarthquake.value = earthquake;
        markEarthquakeLocations(earthquake);
        updateSelectedRow();
        updateMapColors(); // 更新地圖顏色
        if (isMobileListVisible.value) {
            toggleMobileList();
        }
        }

        function updateSelectedRow() {
        d3.selectAll(".earthquake .table-tr").classed("selected", false);
        d3.select(`.earthquake .table-tr[data-id='${selectedEarthquake.value.earthquakeNo}']`).classed("selected", true);
        }

        // 提取括號內的內容
        function extractLocation(locationText) {
        const match = locationText.match(/\(([^)]+)\)/);
        return match ? match[1] : locationText;
        }

        // 獲取縣市填充顏色
        function getCountyFillColor(d, selectedEarthquake) {
        if (!d.properties || !d.properties["COUNTYNAME"]) {
            console.warn("Missing COUNTYNAME in properties:", d);
            return "var(--bg2-color)";
        }
        if (!selectedEarthquake || !selectedEarthquake.AreaIntensity) {
            console.warn("Missing AreaIntensity in selectedEarthquake:", selectedEarthquake);
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
        function handleCountyHover(event, d) {
        d3.select(event.currentTarget).style("opacity", 1);
        const countyName = d.properties["COUNTYNAME"];
        const areaIntensity = selectedEarthquake.value.AreaIntensity.find(area => area.countyName === countyName);
        const intensityValue = areaIntensity ? areaIntensity.intensity : "0";

        updateTooltipContent(countyName, intensityValue);
        positionTooltip(event);
        }

        function handleCountyMouseOut(event, d) {
        d3.select(event.currentTarget).style("opacity", 0.5);
        d3.select(".county-tip").style("visibility", "hidden");
        }

        // 更工具提示內容
        function updateTooltipContent(countyName, intensityValue) {
        d3.select("#tooltip-county").text(countyName);
        d3.select("#tooltip-intensity").text(intensityValue + "級");
        }

        // 定位工具提示
        function positionTooltip(event) {
        const tooltip = d3.select(".county-tip");
        if (!tooltip.node()) return;

        const tooltipWidth = tooltip.node().offsetWidth;
        const tooltipHeight = tooltip.node().offsetHeight;
        const pageWidth = window.innerWidth;
        const pageHeight = window.innerHeight;

        let left = event.pageX + 10;
        let top = event.pageY - tooltipHeight - 10;

        // 檢查是否超出右邊界
        if (left + tooltipWidth > pageWidth) {
            left = event.pageX - tooltipWidth - 10; // 改成左上方顯示
        }

        // 檢查是否超出上邊界
        if (top < 0) {
            top = event.pageY + 10; // 改成下方顯示
        }

        tooltip.style("left", `${left}px`)
               .style("top", `${top}px`)
               .style("visibility", "visible");
        }

        function updateMapColors() {
        g.selectAll("path")
            .attr("fill", d => getCountyFillColor(d, selectedEarthquake.value));
        }

        function toggleMobileList() {
            isMobileListVisible.value = !isMobileListVisible.value;
        }

        return {
        earthquakeData,
        selectedEarthquake,
        selectEarthquake,
        extractLocation,
        getIntensityClass,
        isMobile,
        isMobileListVisible,
        toggleMobileList,
        showDetailModal
        };
    }
};
</script>

<style scoped>
.main {
  margin: auto;
  padding: 80px 80px;
  height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;  
}

/*--------------------------------------------------------------
# Map and Info Containers
--------------------------------------------------------------*/
.map-container {
    margin: auto 30px;
    flex: 1;
    height: 100%;
}

.info-container {
    width: 60%;
    height: 100%;
    display: flex;
    margin: auto;
    padding: 0 30px;
    gap: 30px;
}

.taiwan {
    width: 100%;
    height: 80vh;
    border-radius: 1rem;
    margin: 20px auto;
}

/*--------------------------------------------------------------
# County and Tooltip
--------------------------------------------------------------*/
.county {
    stroke: var(--font-color);
    stroke-width: 1px;
    filter: drop-shadow(var(--shadow5-color));
}

path.county:hover {
    opacity: 1 !important;
}

.county-tip {
    text-align: center;
    position: absolute;
    top: 0;
    padding: 10px 20px;
    color: var(--font-color);
    background-color: var(--bg4-color);
    box-shadow: var(--shadow-color);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    backdrop-filter: blur(3px);
    visibility: hidden;
    z-index: 1000;
    display: flex;
    gap: 10px;
}

/*--------------------------------------------------------------
# Table
--------------------------------------------------------------*/

.post-table {	
    margin: 20px 0;
    width: 100%;
    height: max-content;
    overflow: hidden;
    border-radius: 1rem;
    color: var(--font2-color);
    border-collapse: collapse;
    border: 2px solid var(--border-color);
    background-color: var(--border-color);
}

.mobile-table {
    width: 90%;
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background-color: var(--bg3-color);
}

.mobile-title th .icon {
    margin-left: 10px;
    font-size: 20px;
    vertical-align: middle;
}

.mobile-list {
    opacity: 0;
    visibility: collapse;
    transition: opacity 0.3s ease;
}

.mobile-list.show {
    max-height: 599px;
    overflow-y: auto;
    border: none;
    display: block;
    opacity: 1;
    visibility: visible;
}

.table-th {
    display: flex;
    justify-content: center; /* 讓標題左右置中 */
    align-items: center; /* 垂直置中 */
    position: relative; /* 讓關閉按鈕絕對定位 */
    padding: 10px 15px;
    font-size: 20px;
    background-color: var(--bg3-color);
    border-bottom: 2px solid var(--border-color);
    cursor: default;
}

.table-th.center {
    text-align: center;
    min-width: max-content;
}

.table-td {
    border-collapse: collapse;
    border-spacing: 0;
    margin: 0;
    padding: 10px 15px;
}

.table-td.center {
    text-align: center;
    width: 80px;
}

.table-tr {
    width: 100%;
    background-color: var(--bg-color);
}

.table-tr:hover {
    background-color: var(--hover-bg-color);
}

.earthquake {
    width: 60%;
}

.earthquake .table-body {
    display: block;
    max-height: 647px;
    overflow-y: auto;
    border: none;
}

.earthquake .table-tr {
    cursor: pointer;
}

.table-tr {
    display: table;
    width: 100%;
    border-top: 1px solid var(--border-color);
}

.table-tr:first-child {
    border-top: none;
}

.table-tr.selected {
    background-color: var(--bg2-color);
}

.intensity-td {
    width: 60px;
    height: 60px;
    padding-left: 20px;
    padding-right: 0px;
}

.intensity {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    color: var(--font-color);
}

.intensity.lv-1 {
    background-color: var(--earthquake-span-1);
}

.intensity.lv-2 {
    background-color: var(--earthquake-span-2);
}

.intensity.lv-3 {
    background-color: var(--earthquake-span-3);
}

.intensity.lv-4 {
    background-color: var(--earthquake-span-4);
}

.datetime {
    display: inline-block;
    font-size: 16px;
    margin-bottom: 5px;
}

.earthquake-marker-main:before {
    content: "";
    display: block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: var(--sp-color);
}

.detail .table-td.center {
    border-right: 1px solid var(--border-color);
}

.detail-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: transparent;
    border-radius: 10px;
    z-index: 2000;
    padding: 20px;
    width: 100%;
    max-width: 400px;
}

.modal-content {
    position: relative;
    padding: 20px;
}

.modal-content .table-td.center {
    width: 50px;
}

.close-button {
    position: absolute;
    right: 10px; /* 靠右 */
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center; /* 垂直置中 */
}

.close-button .close-icon {
    color: var(--font-color);
    font-size: 18px;
}

@media screen and (max-width: 768px) {
  .main {
    flex-direction: column;
    padding: 20px 0;
  }

  .map-container {
    width: 100%;
    height: 50vh;
    margin: 10px 0;
  }

  .info-container {
    display: none;
  }

  .earthquake-tip {
    display: block;
  }

  .intensity-td {
    width: 40px;
    padding-left: 15px;
    padding-right: 0px;
  }
}
</style>