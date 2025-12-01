const rowsConfig = [
    { id: 1, name: 'Выручка, руб', base: 500000, isChild: false },
    { id: 2, name: 'Наличные', base: 300000, isChild: true },
    { id: 3, name: 'Безналичный расчет', base: 100000, isChild: true },
    { id: 4, name: 'Кредитные карты', base: 100000, isChild: true },
    { id: 5, name: 'Средний чек, руб', base: 1300, isChild: false },
    { id: 6, name: 'Средний гость, руб', base: 1200, isChild: false },
    { id: 7, name: 'Удаление из чека (после оплаты), руб', base: 1000, isChild: false },
    { id: 8, name: 'Удаление из чека (до оплаты), руб', base: 1300, isChild: false },
    { id: 9, name: 'Количество чеков', base: 34, isChild: false },
    { id: 10, name: 'Количество гостей', base: 32, isChild: false },
];

const getRandomInt = (min, max) => {
    const roundedMin = Math.ceil(min);
    const roundedMax = Math.floor(max);

    return Math.floor(Math.random() * (roundedMax - roundedMin + 1)) + roundedMin;
};

const generateRowData = (config) => {

    const { id, name, base, isChild } = config;

    const deviation = base * .15;

    const currentDay = getRandomInt(base - deviation, base + deviation);
    const yesterday = getRandomInt(base - deviation, base + deviation);
    const thisDayOfWeek = getRandomInt(base - deviation, base + deviation);

    const change = yesterday === 0 ? 0 : Math.round(((currentDay - yesterday) / yesterday) * 100);

    const chartPoints = Array.from({ length: 8 }, () => getRandomInt(base - deviation, base + deviation));

    return {
        id,
        name,
        isChild,
        currentDay,
        yesterday,
        change,
        thisDayOfWeek,
        chartPoints
    };
};

const renderTable = (data, tableBody) => {
    tableBody.innerHTML = "";

    data.forEach(rowData => {

        const rowClass = rowData.isChild ? 'table__row--child' : '';
        let changeClass = rowData.change > 0 ? 'cell--positive' : rowData.change < 0 ? 'cell--negative' : '';
        let lastColumnClass = rowData.currentDay > rowData.thisDayOfWeek ? 'cell--positive' : rowData.currentDay < rowData.thisDayOfWeek ? 'cell--negative' : '';

        const rowHTML = `
        <tr class="${rowClass}" data-id="${rowData.id}">
            <td>${rowData.name}</td>
            <td>${rowData.currentDay.toLocaleString('ru-RU')}</td>
            <td class="${changeClass}">
                <span>${rowData.yesterday.toLocaleString('ru-RU')}</span>
                <span class="change-percent">${rowData.change > 0 ? '+' : ''}${rowData.change}%</span>
            </td>
            <td class="${lastColumnClass}">${rowData.thisDayOfWeek.toLocaleString('ru-RU')}</td>
        </tr>
        `;

        tableBody.insertAdjacentHTML('beforeend', rowHTML);
    });
};


const charRender = (tableData) => {
    const chartElement = document.querySelector("#mainChart");
    const chartOptions = {
        series: [{
            name: tableData[0].name,
            data: tableData[0].chartPoints
        }],
        chart: {
            height: 250,
            type: 'line',
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        colors: ['#369158'],
        stroke: { curve: 'smooth', width: 3 },
        grid: { show: true },
        xaxis: { labels: { show: true }, axisTicks: { show: false }, axisBorder: { show: false } },
        yaxis: {
            labels: {
                formatter: function (value) {
                    if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                    return value.toFixed(0);
                }
            }
        }
    };

    const chart = new ApexCharts(chartElement, chartOptions);
    chart.render();
    document.querySelector('#table-body tr[data-id="1"]').classList.add('active-row');

    return chart;
}

const init = () => {
    const tableBody = document.getElementById('table-body');

    const tableData = rowsConfig.map(config => generateRowData(config));

    const children = tableData.filter(item => item.isChild);
    const revenueRow = tableData.find(item => item.name === "Выручка, руб");

    if (revenueRow && children.length > 0) {
        revenueRow.currentDay = children.reduce((sum, item) => sum + item.currentDay, 0);
        revenueRow.yesterday = children.reduce((sum, item) => sum + item.yesterday, 0);
        revenueRow.thisDayOfWeek = children.reduce((sum, item) => sum + item.thisDayOfWeek, 0);
        revenueRow.change = revenueRow.yesterday === 0 ? 0 : Math.round(((revenueRow.currentDay - revenueRow.yesterday) / revenueRow.yesterday) * 100);
    }

    renderTable(tableData, tableBody);
    const chart = charRender(tableData);

    tableBody.addEventListener('click', (event) => {
        const clickedRow = event.target.closest('tr');
        if (!clickedRow) return;

        const rowId = parseInt(clickedRow.dataset.id);

        const rowData = tableData.find(item => item.id === rowId);
        if (!rowData) return;

        chart.updateSeries([{
            name: rowData.name,
            data: rowData.chartPoints
        }]);

        const currentActiveRow = document.querySelector('.active-row');
        if (currentActiveRow) {
            currentActiveRow.classList.remove('active-row');
        }

        clickedRow.classList.add('active-row');
    });
};

init();