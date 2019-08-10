const getJvmsInterval = 60000;
const getApmStaitcsInterval = 180000;
const getDependCheckErrorsInterval = 60000;
const getApmAbnormalRecordsInterval = 60000;

// 用fetch接口进行post form请求时，需要的参数
function getPostFormParams(params) {
    return {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(params).toString()
    };
};

// 查询jvm实例数据
function getJvms(apps, updateJvms) {
    d3.json("/monitor/datavisualization/getJvmInstances.do",
            getPostFormParams({
                "apps": apps
            }))
        .then(
            function (jvms) {
                updateJvms(jvms);
            }
        ).finally(
            function () {
                setTimeout(function () {
                    getJvms(apps, updateJvms);
                }, getJvmsInterval);
            }
        );
}

// 定时更新jvm实例数据
function getJvmsIntervally(apps, updateJvms) {
    if ((typeof updateJvms) !== 'function') {
        return;
    }
    getJvms(apps, updateJvms);
}

// 查询主机状态
function checkHosts(ips, updateHosts) {
    if (!ips) {
        return;
    }
    d3.json("/monitor/datavisualization/getHostInstances.do",
            getPostFormParams({
                "ips": ips
            }))
        .then(
            function (hosts) {
                if (!!updateHosts) {
                    updateHosts(hosts);
                }
            }
        );
}

// 查询应用性能监控的异常记录
function getApmAbnormalRecords(apps, updateApmAbnormalRecords) {
    // 查询mysql
    d3.json("/monitor/datavisualization/getApmAbnormalRecords.do",
            getPostFormParams({
                "apps": apps
            }))
        .then(
            function (warnings) {
                updateApmAbnormalRecords(warnings);
            }
        ).finally(
            function () {
                setTimeout(function () {
                    getApmAbnormalRecords(apps, updateApmAbnormalRecords);
                }, getApmAbnormalRecordsInterval);
            }
        );
}

// 定时更新应用性能监控的异常记录
function getApmAbnormalRecordsIntervally(apps, updateApmAbnormalRecords) {
    if ((typeof updateApmAbnormalRecords) !== 'function') {
        return;
    }
    getApmAbnormalRecords(apps, updateApmAbnormalRecords);
}

// 查询应用性能监控的统计信息
function getApmStaitcs(apps, updateApmStaitcs) {
    d3.json("/monitor/datavisualization/getApmStaitcs.do",
            getPostFormParams({
                "apps": apps
            }))
        .then(
            function (statics) {
                updateApmStaitcs(statics);
            }
        ).finally(
            function () {
                setTimeout(function () {
                    getApmStaitcs(apps, updateApmStaitcs);
                }, getApmStaitcsInterval);
            }
        );
}

// 定时更新应用性能监控的统计信息
function getApmStaitcsIntervally(apps, updateApmStaitcs) {
    if ((typeof updateApmStaitcs) !== 'function') {
        return;
    }
    getApmStaitcs(apps, updateApmStaitcs);
}

// 查询应用性能监控的统计信息
function getDependCheckErrors(apps, updateDependCheckErrors) {
    d3.json("/monitor/datavisualization/getDependCheckErrors.do",
            getPostFormParams({
                "apps": apps
            }))
        .then(
            function (statics) {
                updateDependCheckErrors(statics);
            }
        ).finally(
            function () {
                setTimeout(function () {
                    getDependCheckErrors(apps, updateDependCheckErrors);
                }, getDependCheckErrorsInterval);
            }
        );
}

// 定时更新依赖探测的失败信息
function getDependCheckErrorsIntervally(apps, updateDependCheckErrors) {
    if ((typeof updateDependCheckErrors) !== 'function') {
        return;
    }
    getDependCheckErrors(apps, updateDependCheckErrors);
}

export default {
    getApmAbnormalRecordsIntervally,
    getDependCheckErrorsIntervally,
    getApmStaitcsIntervally,
    getJvmsIntervally,
    checkHosts
}