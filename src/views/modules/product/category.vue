<!--
 * @Author: rocs
 * @Date: 2022-09-12 19:48:45
 * @LastEditors: rocs
 * @LastEditTime: 2022-10-04 18:18:46
 * @Description: 
-->
<!--  -->
<template>
  <div>
    <el-switch
      v-model="draggable"
      active-text="enable dragging"
      inactive-text="unable dragging"
    ></el-switch>
    <el-button v-if="draggable" @click="batchSave">batch save</el-button>
    <el-button type="danger" @click="batchDelete">batch delete</el-button>
    <el-tree
      :data="menus"
      :props="defaultProps"
      @node-click="handleNodeClick"
      :expand-on-click-node="false"
      show-checkbox
      node-key="catId"
      :default-expanded-keys="expandedKey"
      :draggable="draggable"
      :allow-drop="allowDrop"
      @node-drop="handleDrop"
      ref="menuTree"
    >
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span>{{ node.label }}</span>
        <span>
          <el-button
            v-if="node.level <= 2"
            type="text"
            size="mini"
            @click="() => append(data)"
          >
            Append
          </el-button>
          <el-button
            v-if="node.childNodes.length == 0"
            type="text"
            size="mini"
            @click="() => remove(node, data)"
          >
            Delete
          </el-button>
          <el-button type="text" size="mini" @click="edit(data)">
            Edit
          </el-button>
        </span>
      </span>
    </el-tree>

    <el-dialog
      :title="title"
      :visible.sync="dialogVisible"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="category">
        <el-form-item label="category name">
          <el-input v-model="category.name" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="icon">
          <el-input v-model="category.icon" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="product unit">
          <el-input
            v-model="category.productUnit"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">cancel</el-button>
        <el-button type="primary" @click="submitData">yes</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// 这里可以导入其他文件（比如：组件，工具js，第三方插件js，json文件，图片文件等等）
// 例如：import 《组件名称》 from '《组件路径》';

export default {
  // import引入的组件需要注入到对象中才能使用
  components: {},
  // 监听属性 类似于data概念
  computed: {},
  // 监控data中的数据变化
  watch: {},

  data() {
    return {
      pCid: [],
      draggable: false,
      updateNodes: [],
      maxLevel: 0,
      title: "",
      dialogType: "", // edit add
      category: {
        name: "",
        parentCid: 0,
        catLevel: 0,
        showStatus: 1,
        sort: 0,
        catId: null,
        icon: "",
        productUnit: "",
      },
      dialogVisible: false,
      expandedKey: [],
      menus: [],
      defaultProps: {
        children: "children",
        label: "name",
      },
    };
  },
  methods: {
    getMenus() {
      this.$http({
        url: this.$http.adornUrl("/product/category/list/tree"),
        method: "get",
      }).then(({ data }) => {
        console.log("get menus data success!!!!!", data.data),
          (this.menus = data.page);
      });
    },

    batchDelete() {
      let catIds = [];
      let checkedNodes = this.$refs.menuTree.getCheckedNodes();
      console.log("被选中的元素", checkedNodes);
      for (let i = 0; i < checkedNodes.length; i++) {
        catIds.push(checkedNodes[i].catId);
      }
      this.$confirm(`Do you want to delete menus: [${catIds}]?`, "Notice", {
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
        type: "warning",
      }).then(() => {
        this.$http({
          url: this.$http.adornUrl("/product/category/delete"),
          method: "post",
          data: this.$http.adornData(catIds, false),
        }).then(({ data }) => {
            this.$message({
              message: "batch delete success",
              type: "success"
            });
            this.getMenus();
          });
       }).catch(() => {});
    },

    batchSave() {
      this.$http({
        url: this.$http.adornUrl("/product/category/update/sort"),
        method: "post",
        data: this.$http.adornData(this.updateNodes, false),
      }).then(({ data }) => {
        this.$message({
          message: "update sort success!",
          type: "success",
        });

        this.updateNodes = [];
        this.maxLevel = 0;
        this.getMenus();
        this.expandedKey = this.pCid;
        // this.pCid = 0;
      });
    },

    handleDrop(draggingNode, dropNode, dropType, ev) {
      console.log("handleDrop", draggingNode, dropNode, dropType);
      // 1.获取拖拽节点的父节点id
      let pCid = 0;
      let siblings = null;
      if (dropType == "inner") {
        pCid = dropNode.data.catId;
        siblings = dropNode.childNodes;
      } else {
        pCid =
          dropNode.parent.data.catId == undefined
            ? 0
            : dropNode.parent.data.catId;
        siblings = dropNode.parent.childNodes;
      }
      this.pCid.push(pCid);
      // 2.获取当前拖拽节点的最新顺序
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i].data.catId == draggingNode.data.catId) {
          // if the node being traversed is the currently dragging node
          let catLevel = draggingNode.level;
          if (siblings[i].level != draggingNode.level) {
            // current node level changed
            catLevel = siblings[i].level;
            // modify the level of the current node and its children
            this.updateChildNodeLevel(siblings[i]);
          }
          this.updateNodes.push({
            catId: siblings[i].data.catId,
            sort: i,
            parentCid: pCid,
            catLevel: catLevel,
          });
        } else {
          this.updateNodes.push({ catId: siblings[i].data.catId, sort: i });
        }
      }

      console.log("updateNodes", this.updateNodes);

      // 3.获取当前拖拽节点的最新层级
    },

    updateChildNodeLevel(node) {
      if (node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          var cNode = node.childNodes[i].data;
          this.updateNodes.push({
            catId: cNode.catId,
            catLevel: node.childNodes[i].level,
          });
          this.updateChildNodeLevel(node.childNodes[i]);
        }
      }
    },

    handleNodeClick(data) {
      console.log(data);
    },

    // judge if the node can be dropped: no more than 3 levels
    allowDrop(draggingNode, dropNode, type) {
      // check current node overall levels
      console.log("allowDrop", draggingNode, dropNode, type);
      this.countNodeLevel(draggingNode);
      console.log("当前节点深度maxLevel", this.maxLevel);
      let deep = Math.abs(this.maxLevel - draggingNode.level + 1);

      if (type == "inner") {
        return deep + dropNode.level <= 3;
      } else {
        return deep + dropNode.parent.level <= 3;
      }
    },

    countNodeLevel(node) {
      // find all children and get maxLevel
      if (node.childrenNodes != null && node.childNodes.length > 0) {
        for (let i = 0; i < node.childrenNodes.length; i++) {
          if (node.childrenNodes[i].level > this.maxLevel) {
            this.maxLevel = node.childrenNodes[i].level;
          }
          this.countNodeLevel(node.childrenNodes[i]);
        }
      }
    },

    // add edit button
    edit(data) {
      console.log("要修改的数据", data);

      this.dialogType = "edit";
      this.title = "Edit Category";
      this.category = data;

      this.dialogVisible = true;

      // send request and get the current category data
      this.$http({
        url: this.$http.adornUrl(`/product/category/info/${data.catId}`),
        method: "get",
      }).then(({ data }) => {
        console.log("要回显的数据", data);
        this.category.name = data.data.name;
        this.category.icon = data.data.icon;
        this.category.productUnit = data.data.productUnit;
        this.category.parentCid = data.data.parentCid;
        this.category.catLevel = data.data.catLevel;
        this.category.showStatus = data.data.showStatus;
        this.category.sort = data.data.sort;
        this.category.catId = data.data.catId;
      });
    },

    append(data) {
      console.log("append", data);
      this.dialogType = "add";
      this.title = "Add Category";
      this.dialogVisible = true;

      this.category.parentCid = data.catId;
      this.category.catLevel = data.catLevel * 1 + 1;

      this.category.icon = "";
      this.category.productUnit = "";
      this.category.showStatus = 1;
      this.category.sort = 0;
      this.category.catId = null;
      this.category.name = "";
    },

    editCategory() {
      var { catId, name, icon, productUnit } = this.category;
      this.$http({
        url: this.$http.adornUrl("/product/category/update"),
        method: "post",
        data: this.$http.adornData(
          {
            catId,
            name,
            icon,
            productUnit,
          },
          false
        ),
      }).then(({ data }) => {
        console.log("edit category success", data);
        this.dialogVisible = false;
        this.getMenus();
        this.expandedKey = [this.category.parentCid];
      });
    },

    // add category
    addCategory() {
      var { parentCid, name, icon, productUnit, catLevel, showStatus, sort } =
        this.category;
      this.$http({
        url: this.$http.adornUrl("/product/category/save"),
        method: "post",
        data: this.$http.adornData(
          {
            parentCid,
            name,
            icon,
            productUnit,
            catLevel,
            showStatus,
            sort,
          },
          false
        ),
      }).then(({ data }) => {
        console.log("add category success", data);
        this.dialogVisible = false;
        this.getMenus();
        this.expandedKey = [this.category.parentCid];
      });
    },

    addCategory() {
      console.log("需要提交的数据", this.category);
      this.$http({
        url: this.$http.adornUrl("/product/category/save"),
        method: "post",
        data: this.$http.adornData(this.category, false),
      }).then(({ data }) => {
        this.$message({
          message: "Menu saved successfully",
          type: "success",
        });
        // close dialog
        this.dialogVisible = false;
        // refresh menu
        this.getMenus();
        // expand menu
        this.expandedKey.push(this.category.parentCid);
      });
    },

    submitData() {
      if (this.dialogType == "add") {
        this.addCategory();
      }
      if (this.dialogType == "edit") {
        this.editCategory();
      }
    },

    remove(node, data) {
      var ids = [data.catId];
      this.$confirm(`Do you want to delete menu: [${data.name}]?`, "Notice", {
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
        type: "warning",
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl("/product/category/delete"),
            method: "post",
            data: this.$http.adornData(ids, false),
          }).then(({ data }) => {
            // console.log("####delete success...");
            this.$message({
              message: "Menu delete success!",
              type: "success",
            });
            // refresh
            this.getMenus();
            // show default expanded menus
            this.expandedKey = [node.parent.data.catId];
          });
        })
        .catch(() => {});
      console.log("remove", node, data);
    },
  },

  // 生命周期 - 创建完成（可以访问当前this实例）
  created() {
    this.getMenus();
  },
  // 生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {},
  beforeCreate() {}, // 生命周期 - 创建之前
  beforeMount() {}, // 生命周期 - 挂载之前
  beforeUpdate() {}, // 生命周期 - 更新之前
  updated() {}, // 生命周期 - 更新之后
  beforeDestroy() {}, // 生命周期 - 销毁之前
  destroyed() {}, // 生命周期 - 销毁完成
  activated() {}, // 如果页面有keep-alive缓存功能，这个函数会触发
};
</script>
<style scoped>
/* //@import url(); 引入公共css类 */
</style>