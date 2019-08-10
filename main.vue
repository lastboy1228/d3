<template>
  <div id="mainApp">
    <svg id="mainSvg" @dblclick="moveSvgRight" :style="{ 'width': svgWidth + 'px', 'height': svgHeight + 'px' }">
      <!-- 技术组件的logo -->
      <filter v-for="type in types" :key="'filter_' + type" :id="'bg_' + type" x="0%" y="0%" width="100%" height="100%">
        <feImage :xlink:href="'../images/circle_' + type + '.png'" />
      </filter>
      <filter v-for="tech in teches" :key="'filter_' + tech" :id="'bg_' + tech" x="0%" y="0%" width="100%" height="100%">
        <feImage :xlink:href="'../images/' + tech + '.png'" />
      </filter>

      <g id="gForce">
        <!-- 组件节点间的连线 -->
        <path v-for="edge in edges" :key="'path_' + edge.source.index + '_' + edge.target.index" :stroke="edge.color" :d="linkPath(edge)" :stroke-dashoffset="edge.dashoffset" class="link" stroke-opacity="0.9">
        </path>
        <!-- 组件节点的画布，在里面绘制circle pack -->
        <g v-for="node in nodes" :key="'g_' + node.index" :transform="'translate(' + node.x + ',' + node.y + ')'">
          <!-- 代表组件的半透明圆圈 -->
          <circle :id="'app_' + node.index" :style="{ 'opacity': node.bright ? 0.5 : 0.2 }" :r="circlePackRadius(node)" :fill="node.type==0?'rgb(95, 255, 167)':(node.type==1?'rgb(66, 237, 255)':'rgb(112, 135, 255)')"></circle>
          <!-- 代表组件的描边 -->
          <circle :id="'app_cirlce_' + node.index" :r="circlePackRadius(node)" :filter="'url(#bg_' + types[node.type] + ')'"></circle>
          <!-- 组件的描述 -->
          <text x="0" y="0" :dy="textPositionY(node)" text-anchor="middle" :class="{ text: true, lb: node.type===0 , app: node.type===1 , db: node.type===2 }">{{node.desc}}</text>
          <!-- 组件的实例 -->
          <circle v-for="(child, index) in node.children" :key="'inst_' + node.index + '_' + index" :cx="child.x - circlePackRadius(node)" :cy="child.y - circlePackRadius(node)" :r="child.r" :filter="'url(#bg_' + node.tech + ')'"></circle>
        </g>
        <polygon class="logo-outer" :points="`${logoMargin + logoRadius} ${logoMargin} ${sidebarWidth - logoRadius} ${logoMargin} ${sidebarWidth} ${logoMargin + logoRadius} ${sidebarWidth} ${logoMargin + logoHeight - logoRadius} ${sidebarWidth - logoRadius} ${logoMargin + logoHeight} ${logoMargin + logoRadius} ${logoMargin + logoHeight} ${logoMargin} ${logoMargin + logoHeight - logoRadius} ${logoMargin} ${logoMargin + logoRadius}`" />
        <polygon class="logo-border" :points="`${logoMargin} ${logoMargin + logoRadius * 2} ${logoMargin + 3} ${logoMargin + logoRadius * 2 + 3} ${logoMargin + 3} ${logoMargin + logoHeight - logoRadius * 2 - 3} ${logoMargin} ${logoMargin + logoHeight - logoRadius * 2}`" />
        <polygon class="logo-border" :points="`${sidebarWidth - 3} ${logoMargin + logoRadius * 2 + 3} ${sidebarWidth} ${logoMargin + logoRadius * 2} ${sidebarWidth} ${logoMargin + logoHeight - logoRadius * 2} ${sidebarWidth - 3} ${logoMargin + logoHeight - logoRadius * 2 - 3}`" />
      </g>
    </svg>
    <div class="logo-text" :style="{ 'left': logoMargin + 'px', 'top': logoMargin + 'px', 'height': logoHeight + 'px', 'width': (sidebarWidth - logoMargin) + 'px' }">{{logoText}}</div>
    <div id="sidebar" @dblclick="moveSvgBack" :style="{ 'left': logoMargin + 'px', 'top': (logoMargin * 2 + logoHeight) + 'px', 'width': (sidebarWidth - logoMargin) + 'px', 'height': (svgHeight - logoMargin * 3 - logoHeight) + 'px', 'margin-left': (marginLeft - sidebarWidth) + 'px' }">
      <div class="image-border image-border-lt"></div>
      <div class="image-border image-border-lb"></div>
      <div class="image-border image-border-rt"></div>
      <div class="image-border image-border-rb"></div>
    </div>
    <svg-tip :root-svg="tipRootSvg" :target="tipTarget" :node-data="tipNodeData" :show="tipShowing" :show-app-instances="tipShowAppInstances">
      <table>
        <tbody>
          <tr v-for="(ip, index) in ips" :key="'instance_' + index">
            <td>
              &nbsp;{{ip}}
            </td>
          </tr>
        </tbody>
      </table>
    </svg-tip>
  </div>
</template>

<script>
var circlePackSizes = [15, 15, 30, 35, 40, 50, 50, 60, 60, 65]; // 包裹不同实例的pack的大小比例
var types = ["lb", "app", "db"];
var teches = [
  "nginx",
  "tomcat",
  "influxdb",
  "elasticsearch",
  "mysql",
  "mariadb",
  "golang",
  "grafana",
  "kibana"
];
var forceSimulation; // 力导向图计算框架
var colorScale; // 颜色比例尺
var collisions;
var tipOnAppNodeTimeOut;
function dragStarted(d) {
  if (!d3.event.active) {
    // 没有同时拖动其他元素时
    // 重新开始刷新nodes、edges数据
    forceSimulation.alphaTarget(0.8).restart();
  }
  d.fx = d.x;
  d.fy = d.y;
}

function dragging(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function drapEnded(d) {
  if (!d3.event.active) {
    // 不再拖动后，快速停止刷新nodes、edges数据
    forceSimulation.alphaTarget(0);
  }
  d.fx = null;
  d.fy = null;
}

var map = { ng: [], app: [], db: [] };
var mouseOnNode = false;
module.exports = {
  components: {
    svgTip: httpVueLoader("svgTip.vue")
  },
  props: ["data"],
  data() {
    return {
      logoText: "",
      logoRadius: 5,
      logoMargin: 30,
      logoHeight: 40,
      sidebarWidth: 350,
      svgWidth: 0,
      svgHeight: 0,
      marginLeft: 0,
      moveSvgToRight: false,
      types: types,
      teches: teches,
      nodes: [],
      edges: [],
      ips: [],
      tipRootSvg: null,
      tipTarget: null,
      tipNodeData: null,
      tipShowing: false,
      tipShowAppInstances: false
    };
  },
  methods: {
    collideDistance(dNode) {
      return (
        (collisions[dNode.type] / 1920) * (this.svgWidth - this.marginLeft)
      );
    },
    yDistance(dNode) {
      if (dNode.type == 0) {
        return 150;
      } else if (dNode.type == 1) {
        return this.svgHeight / 2;
      } else {
        return this.svgHeight - 100;
      }
    },
    getMinute(warning) {
      var dt = new Date(warning.window - warning.grain);
      return (
        dt.getFullYear() +
        "-" +
        (dt.getMonth() + 1) +
        "-" +
        dt.getDate() +
        " " +
        dt.getHours() +
        ":" +
        dt.getMinutes()
      );
    },
    colorNode(dNode, edges) {
      if (!!dNode.color) {
        return dNode.color;
      }
      var node = dNode;
      var ary = map["ng"];
      if (dNode.type != 0) {
        ary = map["app"];
      }

      if (dNode.type == 2) {
        for (let i = 0; i < edges.length; i++) {
          var edge = edges[i];
          if (edge.target.index == dNode.index) {
            // db的颜色与app颜色相同
            node = edge.source;
            break;
          }
        }
      }

      var index = -1;
      for (let i = 0; i < ary.length; i++) {
        if (ary[i].index == node.index) {
          index = i;
          break;
        }
      }
      return colorScale(index);
    },
    colorEdge(dEdge, edges) {
      if (dEdge.target.type == 1) {
        return this.colorNode(dEdge.target, edges);
      }
      return this.colorNode(dEdge.source, edges);
    },
    circlePackRadius(d) {
      return circlePackSizes[d.instances.length] * 2;
    },
    linkPath(d) {
      var offset = 20;
      var sourceX = d.source.x;
      var sourceY = d.source.y;
      var targetX = d.target.x;
      var targetY = d.target.y;
      var dx = targetX - sourceX;
      var dy = targetY - sourceY;
      var normalise = Math.sqrt(dx * dx + dy * dy);

      // 调整起点、终点
      var sourceX =
        d.source.x + (this.circlePackRadius(d.source) * dx) / normalise;
      var sourceY =
        d.source.y + (this.circlePackRadius(d.source) * dy) / normalise;
      var targetX =
        d.target.x - (this.circlePackRadius(d.target) * dx) / normalise;
      var targetY =
        d.target.y - (this.circlePackRadius(d.target) * dy) / normalise;

      var offSetX = (sourceX + targetX) / 2 + offset * (dy / normalise);
      var offSetY = (sourceY + targetY) / 2 - offset * (dx / normalise);
      return (
        "M" +
        sourceX +
        "," +
        sourceY +
        "S" +
        offSetX +
        "," +
        offSetY +
        " " +
        targetX +
        "," +
        targetY
      );
    },
    linkFlow() {
      var dashoffset = 0;
      var lastFrame = 0;
      var vue = this;

      function flow(t) {
        // requestAnimationFrame在窗口不显示时不执行
        requestAnimationFrame(flow);
        if (t - lastFrame < 75) {
          return;
        }
        lastFrame = t;
        dashoffset -= 2;
        if (dashoffset <= -100) {
          dashoffset = 0;
        }
        vue.edges.forEach(function(edge, index) {
          // 更新原先不存在的dashoffset属性
          Vue.set(edge, "dashoffset", dashoffset);
        });
      }

      setTimeout(flow, 3000);
    },
    getInstancesLocation(instances, size) {
      // 计算circlePack的children数据
      var rootNode = d3.hierarchy({
        children: instances
      });
      rootNode.sum(d => 1);

      var packLayout = d3
        .pack()
        .size([size, size])
        .padding(5);
      packLayout(rootNode);

      return rootNode.descendants().slice(1);
    },
    handleMouseOver(dNode, index, doms) {
      mouseOnNode = true;
      this.nodes.forEach(d => {
        d.bright = false;
      });
      dNode.bright = true;
      if (!!tipOnAppNodeTimeOut) {
        clearTimeout(tipOnAppNodeTimeOut);
        tipOnAppNodeTimeOut = null;
      }
      if (this.tipShowing) {
        if (this.tipTarget === doms[index]) {
          return;
        }
      }
      if (this.needShowTip(dNode)) {
        this.tipShowing = false;
        Vue.nextTick(() => {
          this.tipShowing = true;
          this.tipShowAppInstances = true;
          this.tipTarget = doms[index];
          this.tipNodeData = dNode;
        });
      }
    },
    handleMouseOut(dNode, index, doms) {
      mouseOnNode = false;

      if (!!tipOnAppNodeTimeOut) {
        clearTimeout(tipOnAppNodeTimeOut);
        tipOnAppNodeTimeOut = null;
      }

      tipOnAppNodeTimeOut = setTimeout(() => {
        dNode.bright = false;
        this.tipShowing = false;
        this.tipShowAppInstances = false;
      }, 500);
    },
    drawInstancesPack() {
      // 让组件节点支持拖动
      d3.select("#gForce")
        .selectAll("g")
        .data(this.nodes)
        .each((dNode, index, doms) => {
          // 给circlePack绑定数据，用于d3的循环闪烁动画
          d3.select(doms[index])
            .select("circle.circlePack")
            .datum(dNode);
        })
        .on("mouseenter", this.handleMouseOver)
        .on("mouseleave", this.handleMouseOut)
        .call(
          d3
            .drag()
            .on("start", dragStarted)
            .on("drag", dragging)
            .on("end", drapEnded)
        );

      // 设置应用实例的位置数据
      var apps = [];
      this.nodes.forEach(dNode => {
        if (!!dNode.app) {
          apps.push(dNode.app);
        }
        Vue.set(
          dNode,
          "children",
          this.getInstancesLocation(
            dNode.instances,
            this.circlePackRadius(dNode) * 2
          )
        );
      });
    },
    needShowTip(dNode) {
      this.ips = [];
      for (let index = 0; index < dNode.instances.length; index++) {
        if (!!dNode.instances[index].ip) {
          this.ips.push(dNode.instances[index].ip);
        }
      }
      if (this.ips.length > 0) {
        return true;
      }
      return false;
    },
    textPositionY(d) {
      // if (d.type === 0) {
      //   return -this.circlePackRadius(d);
      // }
      return this.circlePackRadius(d) + 10;
    },
    moveSvg(toRight) {
      if (this.moveSvgToRight !== toRight) {
        return;
      }

      if (this.moveSvgToRight) {
        this.marginLeft += this.sidebarWidth / 10;
      } else {
        this.marginLeft -= this.sidebarWidth / 10;
      }
      if (this.marginLeft < 0) {
        this.marginLeft = 0;
      }
      if (this.marginLeft > this.sidebarWidth) {
        this.marginLeft = this.sidebarWidth;
      }
      // 改变架构图的中心位置
      forceSimulation
        .force("center")
        .x((this.svgWidth - this.marginLeft) / 2 + this.marginLeft)
        .y(this.svgHeight / 2 - 40);
      forceSimulation.force("collision").radius(d => {
        return this.collideDistance(d);
      });
      forceSimulation.force("y").y(d => {
        return this.yDistance(d);
      });

      if (
        (this.moveSvgToRight && this.marginLeft === this.sidebarWidth) ||
        (!this.moveSvgToRight && this.marginLeft === 0)
      ) {
        forceSimulation.alphaTarget(0);
        return;
      }
      requestAnimationFrame(() => {
        this.moveSvg(toRight);
      });
    },
    moveSvgRight() {
      if (this.moveSvgToRight) {
        return;
      }

      this.tipShowing = false;
      this.moveSvgToRight = true;
      this.moveSvg(this.moveSvgToRight);
      forceSimulation.alphaTarget(0.8).restart();
    },
    moveSvgBack() {
      if (!this.moveSvgToRight) {
        return;
      }

      this.tipShowing = false;
      this.moveSvgToRight = false;
      this.moveSvg(this.moveSvgToRight);
      forceSimulation.alphaTarget(0.8).restart();
    }
  },
  created: function() {
    console.log("vue created");
  },
  mounted: function() {
    console.log("vue mounted");
    // 初始化tip组件
    this.tipRootSvg = document.getElementById("mainSvg");

    this.svgWidth = document.getElementById("mainApp").clientWidth;
    this.svgHeight = document.getElementById("mainApp").clientHeight;
    console.log(this.svgWidth + "," + this.svgHeight);
    console.log(this.data);
    collisions = this.data.collisions;
    this.logoText = this.data.logo;
    var nodes = this.data.nodes;
    var edges = this.data.edges;
    nodes.forEach(node => {
      if (node.type == 0) {
        map["ng"].push(node);
      } else if (node.type == 1) {
        map["app"].push(node);
      } else if (node.type == 2) {
        map["db"].push(node);
      }
    });
    // 根据组件的个数，设置颜色比例尺
    // ordinal的颜色不够用，会重复
    colorScale = d3
      .scaleOrdinal()
      .domain(d3.range(Math.max(map["ng"].length, map["app"].length)))
      .range(d3.schemeSet3);

    //初始化力导向图
    //// 初始化力导向图计算框架
    forceSimulation = d3
      .forceSimulation()
      .force(
        "center",
        d3.forceCenter(this.svgWidth / 2, this.svgHeight / 2 - 40)
      )
      .force("link", d3.forceLink().strength(0.01))
      //不同类型的节点在y方向上进行分层
      .force(
        "y",
        d3
          .forceY()
          .strength(0.5)
          .y(d => {
            return this.yDistance(d);
          })
      )
      //节点之间分离
      .force("charge", d3.forceManyBody().strength(100))
      ////节点之间的最小距离
      .force(
        "collision",
        d3
          .forceCollide()
          .strength(1)
          .radius(d => {
            return this.collideDistance(d);
          })
      );
    forceSimulation.nodes(nodes);
    forceSimulation.force("link").links(edges);

    //nodes和edges的数据都被更新了
    console.log("nodes", nodes);
    console.log("edges", edges);
    nodes.forEach(node => {
      node.color = this.colorNode(node, edges);
      node.bright = false;
    });
    edges.forEach(edge => {
      edge.color = this.colorEdge(edge, edges);
    });
    this.edges = edges;
    this.nodes = nodes;

    // 数据流动效果
    this.linkFlow();
    Vue.nextTick(this.drawInstancesPack);
  },
  beforeDestroy: function() {
    console.log("vue destroying");
  }
};
</script>

<style scoped>
#mainApp {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-image: url("honeycomb.png");
  background-size: cover;
  overflow: hidden;
}

#mainSvg {
  display: block;
}

.link {
  fill: none;
  stroke-width: 1px;
  stroke-dasharray: 95, 5;
}

.text {
  font-family: PingFangSC-Medium;
  font-size: 14px;
}
.text.lb {
  fill: rgb(95, 255, 167);
}
.text.app {
  fill: rgb(66, 237, 255);
}

.text.db {
  fill: rgba(112, 135, 255);
}

.warning-header {
  color: #42edff;
  font-family: PingFangSC-Medium;
  font-size: 14px;
  line-height: 18px;
}

.warning-text {
  color: #2fa3b9;
  font-family: PingFangSC-Regular;
  font-size: 12px;
  line-height: 18px;
}

.warning-header2 {
  color: #5fffa7;
  font-family: PingFangSC-Medium;
  font-size: 14px;
  line-height: 18px;
}

.warning-text2 {
  color: #42af81;
  font-family: PingFangSC-Regular;
  font-size: 12px;
  line-height: 18px;
}

.image-border {
  margin: 0;
  padding: 0;
  position: absolute;
  width: 8px;
  height: 8px;
}

.image-border-lt {
  top: 0px;
  left: 0px;
  border-left: 1px solid rgb(67, 194, 207);
  border-top: 1px solid rgb(67, 194, 207);
}

.image-border-rt {
  top: 0px;
  right: 0px;
  border-right: 1px solid rgb(67, 194, 207);
  border-top: 1px solid rgb(67, 194, 207);
}

.image-border-lb {
  bottom: 0px;
  left: 0px;
  border-left: 1px solid rgb(67, 194, 207);
  border-bottom: 1px solid rgb(67, 194, 207);
}

.image-border-rb {
  bottom: 0px;
  right: 0px;
  border-right: 1px solid rgb(67, 194, 207);
  border-bottom: 1px solid rgb(67, 194, 207);
}

.logo-outer {
  fill: rgb(13, 25, 59);
  fill-opacity: 0.6;
  stroke: rgb(67, 194, 207);
  stroke-width: 1px;
}

.logo-border {
  fill: rgb(67, 194, 207);
}

.logo-text {
  z-index: 1;
  position: fixed;
  color: rgb(66, 237, 255);
  font-family: PingFangSC-Medium;
  font-size: 20px;
  letter-spacing: 0;
  text-align: center;
  padding: 5px;
}

#sidebar {
  z-index: 1;
  position: fixed;
  background-color: rgba(13, 25, 59, 0.6);
  overflow-x: hidden;
  overflow-y: hidden;
}
</style>