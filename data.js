export default {
    "logo": "Deployment Architecture",
    "collisions": [
        150,
        200,
        200
    ],
    "nodes": [{
            "seq": 0,
            "name": "user.xxx.com",
            "type": 0,
            "tech": "nginx",
            "desc": "user interface",
            "instances": [{
                "ip": "10.10.10.1"
            }, {
                "ip": "10.10.10.2"
            }],
            "abnormal": false
        },
        {
            "seq": 1,
            "name": "api.xxx.com",
            "type": 0,
            "tech": "nginx",
            "desc": "api interface",
            "instances": [{
                "ip": "10.10.10.3"
            }, {
                "ip": "10.10.10.4"
            }],
            "abnormal": false
        },
        {
            "seq": 2,
            "name": "kibana.xxx.com",
            "type": 0,
            "tech": "nginx",
            "desc": "search elasticsearch",
            "instances": [{
                "ip": "10.10.10.5"
            }, {
                "ip": "10.10.10.6"
            }],
            "abnormal": false
        },
        {
            "seq": 3,
            "name": "monitor-web",
            "type": 1,
            "app": "monitor",
            "tech": "tomcat",
            "desc": "web page server",
            "instances": [{
                "ip": "10.10.10.7"
            }, {
                "ip": "10.10.10.8"
            }],
            "abnormal": false
        },
        {
            "seq": 4,
            "name": "monitor-shell",
            "type": 1,
            "tech": "golang",
            "desc": "web shell",
            "instances": [{
                "ip": "10.10.10.9"
            }, {
                "ip": "10.10.10.10"
            }],
            "abnormal": false
        },
        {
            "seq": 5,
            "name": "grafana",
            "type": 1,
            "tech": "grafana",
            "desc": "report",
            "instances": [{
                "ip": "10.10.10.11"
            }],
            "abnormal": false
        },
        {
            "seq": 6,
            "name": "kibana",
            "type": 1,
            "tech": "kibana",
            "desc": "kibana",
            "instances": [{
                "ip": "10.10.10.12"
            }],
            "abnormal": false
        },
        {
            "seq": 7,
            "name": "influxDB",
            "type": 2,
            "tech": "influxdb",
            "desc": "influxdb",
            "instances": [{
                "ip": "10.10.10.13"
            }, {
                "ip": "10.10.10.14"
            }],
            "abnormal": false
        },
        {
            "seq": 8,
            "name": "mysql",
            "type": 2,
            "tech": "mariadb",
            "desc": "one master two slaves",
            "instances": [{
                "ip": "10.10.10.15"
            }, {
                "ip": "10.10.10.16"
            }, {
                "ip": "10.10.10.17"
            }],
            "abnormal": false
        },
        {
            "seq": 9,
            "name": "elasticSearch",
            "type": 2,
            "tech": "elasticsearch",
            "desc": "elasticsearch",
            "instances": [{
                "ip": "10.10.10.18"
            }, {
                "ip": "10.10.10.19"
            }, {
                "ip": "10.10.10.20"
            }, {
                "ip": "10.10.10.21"
            }, {
                "ip": "10.10.10.22"
            }, {
                "ip": "10.10.10.23"
            }, {
                "ip": "10.10.10.24"
            }],
            "abnormal": false
        }
    ],
    "edges": [{
            "source": 0,
            "target": 3
        },
        {
            "source": 0,
            "target": 4
        },
        {
            "source": 0,
            "target": 5
        },
        {
            "source": 1,
            "target": 3
        },
        {
            "source": 2,
            "target": 6
        },
        {
            "source": 3,
            "target": 7
        },
        {
            "source": 3,
            "target": 8
        },
        {
            "source": 3,
            "target": 9
        },
        {
            "source": 4,
            "target": 8
        },
        {
            "source": 5,
            "target": 7
        },
        {
            "source": 5,
            "target": 9
        },
        {
            "source": 6,
            "target": 9
        }
    ]
}