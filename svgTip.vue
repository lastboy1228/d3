<template>
  <!-- https://github.com/caged/d3-tip/releases/tag/v0.9.1 -->
  <div v-if="show" :style="{ 'top': top + 'px', 'left': left + 'px' }" :class="{ 'd3-tip': true, lb: nodeData.type===0 , app: nodeData.type===1 , db: nodeData.type===2 , 'n': dir==='n', 'e': dir==='e', 's': dir==='s', 'w': dir==='w' }">
    <div class="image-border image-border-lt" :class="{ lb: nodeData.type===0 , app: nodeData.type===1 , db: nodeData.type===2 }"></div>
    <div class="image-border image-border-lb" :class="{ lb: nodeData.type===0 , app: nodeData.type===1 , db: nodeData.type===2 }"></div>
    <slot></slot>
    <div class="image-border image-border-rt" :class="{ lb: nodeData.type===0 , app: nodeData.type===1 , db: nodeData.type===2 }"></div>
    <div class="image-border image-border-rb" :class="{ lb: nodeData.type===0 , app: nodeData.type===1 , db: nodeData.type===2 }"></div>
  </div>
</template>

<script>
var point = null; // 用于辅助换算svg内的元素的坐标
var directionCallbacks = null;
module.exports = {
  props: ["rootSvg", "target", "show", "nodeData"],
  data: () => {
    return {
      top: 0,
      left: 0,
      dir: "n"
    };
  },
  watch: {
    show(newVal, oldVal) {
      if (!this.rootSvg || !this.target || !newVal || !this.nodeData) {
        return;
      }

      if (point == null) {
        point = this.rootSvg.createSVGPoint();
      }
      if (directionCallbacks == null) {
        directionCallbacks = {
          n: this.directionNorth,
          s: this.directionSouth,
          e: this.directionEast,
          w: this.directionWest,
          nw: this.directionNorthWest,
          ne: this.directionNorthEast,
          sw: this.directionSouthWest,
          se: this.directionSouthEast
        };
      }

      Vue.nextTick(this.updatePosition);
    }
  },
  methods: {
    updatePosition() {
      var poffset = [-10, 0];
      this.dir = "n";
      if (this.nodeData.type === 0) {
        poffset = [5, 0];
        this.dir = "s";
      }

      var coords = directionCallbacks[this.dir].apply(this);
      var scrollTop = document.body.scrollTop;
      var scrollLeft = document.body.scrollLeft;
      this.top = coords.top + poffset[0] + scrollTop;
      this.left = coords.left + poffset[1] + scrollLeft;
    },
    getScreenBBox() {
      var targetel = this.target;
      while (targetel.getScreenCTM == null && targetel.parentNode != null) {
        targetel = targetel.parentNode;
      }

      var bbox = {},
        matrix = targetel.getScreenCTM(),
        tbbox = targetel.getBBox(),
        width = tbbox.width,
        height = tbbox.height,
        x = tbbox.x,
        y = tbbox.y;

      point.x = x;
      point.y = y;
      bbox.nw = point.matrixTransform(matrix);
      point.x += width;
      bbox.ne = point.matrixTransform(matrix);
      point.y += height;
      bbox.se = point.matrixTransform(matrix);
      point.x -= width;
      bbox.sw = point.matrixTransform(matrix);
      point.y -= height / 2;
      bbox.w = point.matrixTransform(matrix);
      point.x += width;
      bbox.e = point.matrixTransform(matrix);
      point.x -= width / 2;
      point.y -= height / 2;
      bbox.n = point.matrixTransform(matrix);
      point.y += height;
      bbox.s = point.matrixTransform(matrix);

      return bbox;
    },
    directionNorth() {
      var bbox = this.getScreenBBox();
      return {
        top: bbox.n.y - this.$el.offsetHeight,
        left: bbox.n.x - this.$el.offsetWidth / 2
      };
    },
    directionSouth() {
      var bbox = this.getScreenBBox();
      return {
        top: bbox.s.y,
        left: bbox.s.x - this.$el.offsetWidth / 2
      };
    },
    directionEast() {
      var bbox = this.getScreenBBox();
      return {
        top: bbox.e.y - this.$el.offsetHeight / 2,
        left: bbox.e.x
      };
    },
    directionWest() {
      var bbox = this.getScreenBBox();
      return {
        top: bbox.w.y - this.$el.offsetHeight / 2,
        left: bbox.w.x - this.$el.offsetWidth
      };
    },
    directionNorthWest() {
      var bbox = this.getScreenBBox();
      return {
        top: bbox.nw.y - this.$el.offsetHeight,
        left: bbox.nw.x - this.$el.offsetWidth
      };
    },
    directionNorthEast() {
      var bbox = this.getScreenBBox();
      return {
        top: bbox.ne.y - this.$el.offsetHeight,
        left: bbox.ne.x
      };
    },
    directionSouthWest() {
      var bbox = this.getScreenBBox();
      return {
        top: bbox.sw.y,
        left: bbox.sw.x - this.$el.offsetWidth
      };
    },
    directionSouthEast() {
      var bbox = this.getScreenBBox();
      return {
        top: bbox.se.y,
        left: bbox.se.x
      };
    }
  }
};
</script>

<style scoped>
.d3-tip {
  position: absolute;
  pointer-events: all;
  box-sizing: border-box;
  padding: 5px 10px 5px 10px;
  /* border-radius: 5px; */
  pointer-events: none;
  font-family: PingFangSC-Medium;
  font-size: 12px;
  line-height: 18px;
}

.d3-tip.lb {
  background: rgba(30, 71, 80, 0.8);
  color: rgba(95, 255, 167);
}

.image-border.lb,
.d3-tip.lb:after {
  color: rgba(95, 255, 167);
  border-color: rgba(95, 255, 167);
}

.d3-tip.app {
  background: rgba(20, 56, 88, 0.8);
  color: rgba(66, 237, 255);
}

.image-border.app,
.d3-tip.app:after {
  color: rgba(66, 237, 255);
  border-color: rgba(66, 237, 255);
}

.d3-tip.db {
  background: rgba(27, 37, 80, 0.8);
  color: rgba(112, 135, 255);
}
.image-border.db,
.d3-tip.db:after {
  color: rgba(112, 135, 255);
  border-color: rgba(112, 135, 255);
}

/* Creates a small triangle extender for the tooltip */
.d3-tip:after {
  box-sizing: border-box;
  display: inline;
  font-size: 10px;
  width: 100%;
  line-height: 1;
  position: absolute;
  pointer-events: none;
}

/* Northward tooltips */
.d3-tip.n:after {
  content: "\25BC";
  margin: -1px 0 0 0;
  top: 100%;
  left: 0;
  text-align: center;
}

/* Eastward tooltips */
.d3-tip.e:after {
  content: "\25C0";
  margin: -4px 0 0 0;
  top: 50%;
  left: -8px;
}

/* Southward tooltips */
.d3-tip.s:after {
  content: "\25B2";
  margin: -4px 0 1px 0;
  top: -8px;
  left: 0;
  text-align: center;
}

/* Westward tooltips */
.d3-tip.w:after {
  content: "\25B6";
  margin: -4px 0 0 -1px;
  top: 50%;
  left: 100%;
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
  border-left: 1px solid #ffffff;
  border-top: 1px solid #ffffff;
}

.image-border-rt {
  top: 0px;
  right: 0px;
  border-right: 1px solid #ffffff;
  border-top: 1px solid #ffffff;
}

.image-border-lb {
  bottom: 0px;
  left: 0px;
  border-left: 1px solid #ffffff;
  border-bottom: 1px solid #ffffff;
}

.image-border-rb {
  bottom: 0px;
  right: 0px;
  border-right: 1px solid #ffffff;
  border-bottom: 1px solid #ffffff;
}
</style>