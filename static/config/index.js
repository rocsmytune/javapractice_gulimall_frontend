/*
 * @Author: rocs
 * @Date: 2022-08-27 14:34:32
 * @LastEditors: rocs
 * @LastEditTime: 2022-09-12 20:42:17
 * @Description: 向网关发送请求 forward requests to gateway:88
 */
/**
 * 开发环境
 */
;(function () {
  window.SITE_CONFIG = {};

  // api接口请求地址
  window.SITE_CONFIG['baseUrl'] = 'http://localhost:88/api';

  // cdn地址 = 域名 + 版本号
  window.SITE_CONFIG['domain']  = './'; // 域名
  window.SITE_CONFIG['version'] = '';   // 版本号(年月日时分)
  window.SITE_CONFIG['cdnUrl']  = window.SITE_CONFIG.domain + window.SITE_CONFIG.version;
})();
