<!--
 * @Author: rocs
 * @Date: 2022-09-12 19:48:45
 * @LastEditors: rocs
 * @LastEditTime: 2022-10-03 16:51:14
 * @Description: 
-->
<!--  -->
<template>
  <div>
    <el-tree
      :data="menus"
      :props="defaultProps"
      @node-click="handleNodeClick"
      :expand-on-click-node="false"
      show-checkbox
      node-key="catId"
      :default-expanded-keys="expandedKey"
      draggable
      :allow-drop="allowDrop"
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
          <el-input v-model="category.productUnit" autocomplete="off"></el-input>
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
//这里可以导入其他文件（比如：组件，工具js，第三方插件js，json文件，图片文件等等）
//例如：import 《组件名称》 from '《组件路径》';

export default {
  //import引入的组件需要注入到对象中才能使用
  components: {},
  //监听属性 类似于data概念
  computed: {},
  //监控data中的数据变化
  watch: {},

  data() {
    return {
      maxLevel: 0,
      title: "",
      dialogType: "", //edit add
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

    handleNodeClick(data) {
      console.log(data);
    },

    //judge if the node can be dropped: no more than 3 levels
    allowDrop(draggingNode, dropNode, type) {
      //check current node overall levels
      console.log("allowDrop", draggingNode, dropNode, type);
      this.countNodeLevel(draggingNode.data);
      console.log("当前节点深度maxLevel", this.maxLevel);
      let deep = this.maxLevel - draggingNode.data.catLevel + 1

      if(type == 'inner'){
        deep = deep + dropNode.level;
      } else {
        deep = deep + dropNode.parent.level;
      }

      return deep <= 3;
    },

    countNodeLevel(node) {
      //find all children and get maxLevel
      if(node.children != null && node.children.length > 0){
        for(let i = 0; i < node.children.length; i++) {
          if(node.children[i].catLevel > this.maxLevel) {
            this.maxLevel = node.children[i].catLevel;
          }
          this.countNodeLevel(node.children[i]);
        }
      } else {
        this.maxLevel = node.catLevel;
      }
    },

    //add edit button
    edit(data) {
      console.log("要修改的数据", data);

      this.dialogType = "edit";
      this.title = "Edit Category";
      this.category = data;

      this.dialogVisible = true;

      //send request and get the current category data
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


    //add category
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
        //close dialog
        this.dialogVisible = false;
        //refresh menu
        this.getMenus();
        //expand menu
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
            //refresh
            this.getMenus();
            //show default expanded menus
            this.expandedKey = [node.parent.data.catId];
          });
        })
        .catch(() => {});
      console.log("remove", node, data);
    },
  },

  //生命周期 - 创建完成（可以访问当前this实例）
  created() {
    this.getMenus();
  },
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {},
  beforeCreate() {}, //生命周期 - 创建之前
  beforeMount() {}, //生命周期 - 挂载之前
  beforeUpdate() {}, //生命周期 - 更新之前
  updated() {}, //生命周期 - 更新之后
  beforeDestroy() {}, //生命周期 - 销毁之前
  destroyed() {}, //生命周期 - 销毁完成
  activated() {}, //如果页面有keep-alive缓存功能，这个函数会触发
};
</script>
<style scoped>
/* //@import url(); 引入公共css类 */
</style>