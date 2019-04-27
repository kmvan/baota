var soft = {
    get_list: function (page, type, search) {
        if (page == undefined) page = 0;
        if (type == undefined) type = 0;

        var _this = this;
        var istype = getCookie('softType');
        if (istype == 'undefined' || istype == 'null' || !istype) {
            istype = 0;
        }
        if (type == 0) type = bt.get_cookie('softType');
        if (page == 0) page = bt.get_cookie('p' + type);

        bt.soft.get_soft_list(page, type, search, function (rdata) {

            if (rdata.pro >= 0) {
                $("#updata_pro_info").html('');
            } else if (rdata.pro === -2) {
                $("#updata_pro_info").html('<div class="alert alert-success" style="margin-bottom:15px"><strong>专业版已到期，付费插件暂停使用。</strong><button class="btn btn-success btn-xs va0 updata_pro" onclick="bt.soft.updata_pro()" title="立即续费专业版" style="margin-left:8px">立即续费</button>');
            } else if (rdata.pro === -1) {
                $("#updata_pro_info").html('<div class="alert alert-success" style="margin-bottom:15px"><strong > 升级专业版，所有插件，免费使用。</strong><button class="btn btn-success btn-xs va0 updata_pro" onclick="bt.soft.updata_pro()" title="立即升级专业版" style="margin-left:8px">立即升级</button>\</div>');
            }

            if (type == 10) {
                $("#updata_pro_info").html('<div class="alert alert-info" style="margin-bottom:15px"><strong>宝塔开发者平台已上线，诚邀全球优秀的开发者加入，门槛低，收入高。</strong><a class="btn btn-success btn-xs va0" href="https://www.bt.cn/developer/" title="免费入驻" style="margin-left: 8px" target="_blank">免费入驻</a><a class="btn btn-success btn-xs va0" href="https://www.bt.cn/bbs/forum-40-1.html" title="点击获取第三方应用" style="margin-left: 8px" target="_blank">获取第三方应用</a><input type="file" style="display:none;" accept=".zip,.tar.gz" id="update_zip" multiple="multiple"><button class="btn btn-success btn-xs" onclick="soft.update_zip_open()" style="margin-left:8px">导入插件</button></div>')
            } else if (type == 11) {
                $("#updata_pro_info").html('<div class="alert alert-info" style="margin-bottom:15px"><strong>即将上线，敬请期待</strong></div>')
            }
            var tBody = '';
            rdata.type.unshift({ icon: 'icon', id: 0, ps: '全部', sort: 1, title: '全部' })
            for (var i = 0; i < rdata.type.length; i++) {
                var c = '';
                if (istype == rdata.type[i].id) {
                    c = 'class="on"';
                }
                tBody += '<span typeid="' + rdata.type[i].id + '" ' + c + '>' + rdata.type[i].title + '</span>';
            }
            if (page) bt.set_cookie('p' + type, page);
            $(".softtype").html(tBody);
            $(".menu-sub span").click(function () {
                var _type = $(this).attr('typeid');
                bt.set_cookie('softType', _type);
                $(this).addClass("on").siblings().removeClass("on");
                soft.get_list(0, _type);
            })
            var data = rdata.list.data;
            $('#softPage').html(rdata.list.page);
            var phps = ['php-5.2', 'php-5.3', 'php-5.4'];
            var _tab = bt.render({
                table: '#softList',
                columns: [
                    {
                        field: 'title', title: '软件名称', width: 165, templet: function (item) {
                            var fName = item.name, version = item.version;
                            if (bt.contains(item.name, 'php-')) {
                                fName = 'php';
                                version = '';
                            }
                            var click_opt = ' ', sStyle = '';
                            if (item.setup) {
                                sStyle = ' style="cursor:pointer"';
                                if (item.admin) {
                                    if (item.endtime >= 0 || item.price == 0) {
                                        click_opt += 'onclick="bt.soft.set_lib_config(\'' + item.name + '\',\'' + item.title + '\')" ';
                                    }

                                }
                                else {
                                    click_opt += ' onclick="soft.set_soft_config(\'' + item.name + '\')" ';
                                }
                            }
                            if (rdata.apache22 && item.name.indexOf('php-') >= 0 && $.inArray(item.name, phps) == -1) click_opt = ' title="Apache2.2不兼容此版本，如需使用请切换到Apache2.4或Nginx"';
                            return '<span ' + click_opt + ' ' + sStyle + ' ><img src="/static/img/soft_ico/ico-' + fName + '.png">' + item.title + ' ' + version + '</span>';
                        }
                    },
                    {
                        field: 'price', title: '开发商', width: 92, templet: function (item) {
                            if(!item.author) return '官方'
                            return item.author;
                        }
                    },
                    {
                        field: 'ps', title: '说明', templet: function (item) {
                            var ps = item.ps;
                            var is_php = item.name.indexOf('php-') >= 0;

                            if (is_php && item.setup) {
                                if (rdata.apache22 && $.inArray(item.name, phps) >= 0) {
                                    if (item.fpm) {
                                        ps += " <span style='color:red;'>(" + lan.soft.apache22 + ")</span>";
                                    }
                                }
                                else if (!rdata.apache22) {
                                    if (!item.fpm) {
                                        ps += " <span style='color:red;'>(" + lan.soft.apache24 + ")</span>";
                                    }
                                }
                            }
                            return '<span>' + ps + '</span>';
                        }
                    },
                    {
                        field: 'price', title: '价格', width: 92, templet: function (item) {
                            var price = '免费';
                            if (item.price > 0) {
                                price = '<span style="color:#fc6d26">￥' + item.price + '</span>';
                            }
                            return price;
                        }
                    },
                    {
                        field: 'endtime', width: 120, title: '到期时间', templet: function (item) {
                            var endtime = '--';
                            if (item.pid > 0) {
                                if (item.endtime > 0) {
                                    if (item.type != 10) {
                                        endtime = bt.format_data(item.endtime, 'yyyy/MM/dd') + '<a class="btlink" onclick="bt.soft.re_plugin_pay(\'' + item.title + '\',\'' + item.pid + '\',1)"> (续费)</a>';
                                    } else {
                                        endtime = bt.format_data(item.endtime, 'yyyy/MM/dd') + '<a class="btlink" onclick="bt.soft.re_plugin_pay_other(\'' + item.title + '\',\'' + item.pid + '\',1,'+item.price+')"> (续费)</a>';
                                    }
                                }
                                else if (item.endtime === 0) {
                                    endtime = '永久';
                                }
                                else if (item.endtime === -1) {
                                    endtime = '未开通';
                                }
                                else if (item.endtime === -2) {
                                    if (item.type != 10) {
                                        endtime = '已到期' + '<a class="btlink" onclick="bt.soft.re_plugin_pay(\'' + item.title + '\',\'' + item.pid + '\',1)"> (续费)</a>';
                                    }else {
                                        endtime = '已到期' + '<a class="btlink" onclick="bt.soft.re_plugin_pay_other(\'' + item.title + '\',\'' + item.pid + '\',1,'+item.price+')"> (续费)</a>';
                                    }
                                }
                            }
                            return endtime;
                        }
                    },
                    {
                        field: 'path', width: 40, title: '位置', templet: function (item) {
                            var path = '';
                            if (item.setup) {
                                path = '<span class="glyphicon glyphicon-folder-open"  onclick="openPath(\'' + item.uninsatll_checks + '\')"></span>';
                            }
                            return path;
                        }
                    },
                    {
                        field: 'status', width: 40, title: '状态', templet: function (item) {
                            var status = '';
                            if (item.setup) {
                                if (item.status) {
                                    status = '<span style="color:#20a53a" class="glyphicon glyphicon-play"></span>';
                                }
                                else {
                                    status = '<span style="color:red" class="glyphicon glyphicon-pause"></span>';
                                }
                            }
                            return status;
                        }
                    },
                    {
                        field: 'index', width: 64, title: '首页显示', templet: function (item) {
                            var to_index = '';
                            if (item.setup) {
                                var checked = '';
                                if (item.index_display) checked = 'checked';
                                var item_id = item.name.replace(/\./, "");
                                to_index = '<div class="index-item"><input class="btswitch btswitch-ios" id="index_' + item_id + '" type="checkbox" ' + checked + '><label class="btswitch-btn" for="index_' + item_id + '" onclick="bt.soft.to_index(\'' + item.name + '\')"></label></div>';
                            }
                            return to_index;
                        }
                    },
                    {
                        field: 'opt', width: 120, title: '操作', align: 'right', templet: function (item) {
                            var option = '';

                            var pay_opt = '';
                            if (item.endtime < 0 && item.pid > 0) {
                                var re_msg = '';
                                var re_status = 0;
                                switch (item.endtime) {
                                    case -1:
                                        re_msg = '立即购买';
                                        break;
                                    case -2:
                                        re_msg = '立即续费';
                                        re_status = 1;
                                        break;
                                }
                                if (item.type != 10) {
                                    pay_opt = '<a class="btlink" onclick="bt.soft.re_plugin_pay(\'' + item.title + '\',\'' + item.pid + '\',' + re_status + ')">' + re_msg + '</a>';
                                } else {
                                    pay_opt = '<a class="btlink" onclick="bt.soft.re_plugin_pay_other(\'' + item.title + '\',\'' + item.pid + '\',' + re_status + ','+item.price+')">' + re_msg + '</a>';
                                }
                                
                            }
                            var is_php = item.name.indexOf('php-') >= 0;
                            if (rdata.apache22 && is_php && $.inArray(item.name, phps) == -1) {
                                if (item.setup) {
                                    option = '<a class="btlink" onclick="bt.soft.un_install(\'' + item.name + '\')" >' + lan.soft.uninstall + '</a>';
                                }
                                else {
                                    option = '<span title="Apache2.2不兼容此版本，如需使用请切换到Apache2.4或Nginx">不兼容</span>';
                                }
                            }
                            else if (rdata.apache24 && item.name == 'php-5.2') {
                                if (item.setup) {
                                    option = '<a class="btlink" onclick="bt.soft.un_install(\'' + item.name + '\')" >' + lan.soft.uninstall + '</a>';
                                }
                                else {
                                    option = '<span title="Apache2.4不兼容此版本，如需使用请切换到Apache2.2或Nginx">不兼容</span>';
                                }
                            }
                            else {
                                if (item.setup) {
                                    if (pay_opt == '') {
                                        if (item.versions.length > 1) {
                                            for (var i = 0; i < item.versions.length; i++) {
                                                var min_version = item.versions[i]
                                                var ret = bt.check_version(item.version, min_version.m_version + '.' + min_version.version);
                                                if (ret > 0) {
                                                    if (ret == 2) option += '<a class="btlink" onclick="bt.soft.update_soft(\'' + item.name + '\',\'' + item.title + '\',\'' + min_version.m_version + '\',\'' + min_version.version + '\')" >更新</a> | ';
                                                    break;
                                                }
                                            }
                                        }
                                        else {
                                            var min_version = item.versions[0];
                                            var cloud_version = min_version.m_version + '.' + min_version.version;
                                            if (item.version != cloud_version) option += '<a class="btlink" onclick="bt.soft.update_soft(\'' + item.name + '\',\'' + item.title + '\',\'' + min_version.m_version + '\',\'' + min_version.version + '\')" >更新</a> | ';
                                        }
                                        if (item.admin) {
                                            option += '<a class="btlink" onclick="bt.soft.set_lib_config(\'' + item.name + '\',\'' + item.title + '\')">' + lan.soft.setup + '</a> | ';
                                        }
                                        else {
                                            option += '<a class="btlink" onclick="soft.set_soft_config(\'' + item.name + '\')">' + lan.soft.setup + '</a> | ';
                                        }
                                    } else {
                                        option = pay_opt + ' | ' + option;
                                    }
                                    option += '<a class="btlink" onclick="bt.soft.un_install(\'' + item.name + '\')" >' + lan.soft.uninstall + '</a>';
                                }
                                else if (item.task == '-1') {
                                    option = '<a class="btlink" onclick="messagebox()"  >正在安装</a>';
                                }
                                else if (item.task == '0') {
                                    option = '<a class="btlink" onclick="messagebox()"  >等待安装</a>';
                                }
                                else {
                                    if (pay_opt) {
                                        option = pay_opt;
                                    }
                                    else {
                                        option = '<a class="btlink" onclick="bt.soft.install(\'' + item.name + '\')"  >' + lan.soft.install + '</a>';
                                    }
                                }
                            }
                            return option;
                        }
                    }
                ],
                data: data
            })
        })
    },
    flush_cache: function () {
        bt.set_cookie('force', 1);
        soft.get_list();
    },
    get_config_menu: function (name) //获取设置菜单显示
    {
        var meun = '';
        if (bt.os == 'Linux') {

            var datas = {
                public: [
                    { type: 'config', title: lan.soft.config_edit },
                    { type: 'change_version', title: lan.soft.nginx_version }
                ],
                mysqld: [
                    { type: 'change_data_path', title: lan.soft.save_path },
                    { type: 'change_mysql_port', title: lan.site.port },
                    { type: 'get_mysql_run_status', title: lan.soft.status },
                    { type: 'get_mysql_status', title: lan.soft.php_main7 },
                    { type: 'mysql_log', title: lan.soft.log },
                    { type: 'mysql_slow_log', title: lan.public.slow_log },
                ],
                phpmyadmin: [
                    { type: 'phpmyadmin_php', title: lan.soft.php_version },
                    { type: 'phpmyadmin_safe', title: lan.soft.safe }
                ],
                memcached: [
                    { type: 'memcached_status', title: '负载状态' },
                    { type: 'memcached_set', title: '性能调整' },
                ],
                redis: [
                    { type: 'get_redis_status', title: '负载状态' },
                ],
                tomcat: [
                    { type: 'log', title: '运行日志' }
                ],
                apache: [
                    { type: 'apache_set', title: '性能调整' },
                    { type: 'apache_status', title: lan.soft.nginx_status },
                    { type: 'log', title: '运行日志' }
                ],
                nginx: [
                    { type: 'nginx_set', title: '性能调整' },
                    { type: 'nginx_status', title: lan.soft.nginx_status },
                    { type: 'log', title: '错误日志' }
                ]
            };
            var arrs = datas.public;
            if (name == 'phpmyadmin') arrs = [];
            arrs = arrs.concat(datas[name]);
            if (arrs) {
                for (var i = 0; i < arrs.length; i++) {
                    var item = arrs[i];
                    if (item) {
                        meun += '<p onclick="soft.get_tab_contents(\'' + item.type + '\',this)">' + item.title + '</p>';
                    }
                }
            }
        }
        return meun;
    },
    set_soft_config: function (name) {
        //软件设置
        var _this = this;
        var loading = bt.load();
        bt.soft.get_soft_find(name, function (rdata) {
            loading.close();

            if (name == 'mysql') name = 'mysqld';
            var menuing = bt.open({
                type: 1,
                area: "640px",
                title: name + lan.soft.admin,
                closeBtn: 2,
                shift: 0,
                content: '<div class="bt-w-main" style="width:640px;"><div class="bt-w-menu bt-soft-menu"></div><div id="webEdit-con" class="bt-w-con pd15" style="height:555px;overflow:auto"><div class="soft-man-con bt-form"></div></div></div>'
            });
            var menu = $('.bt-soft-menu').data("data", rdata);
            setTimeout(function () {
                if (name != 'phpmyadmin') menu.append($('<p class="bgw bt_server" onclick="soft.get_tab_contents(\'service\',this)">' + lan.soft.service + '</p>'))
                if (rdata.version_coexist) {
                    var ver = name.split('-')[1].replace('.', '');
                    var opt_list = [
                        { type: 'set_php_config', val: ver, title: lan.soft.php_main5 },
                        { type: 'config_edit', val: ver, title: lan.soft.config_edit },
                        { type: 'set_upload_limit', val: ver, title: lan.soft.php_main2 },
                        { type: 'set_timeout_limit', val: ver, title: lan.soft.php_main3, php53: true },
                        { type: 'config', val: ver, title: lan.soft.php_main4 },
                        { type: 'set_dis_fun', val: ver, title: lan.soft.php_main6 },
                        { type: 'set_fpm_config', val: ver, title: lan.soft.php_main7, apache24: true, php53: true },
                        { type: 'get_php_status', val: ver, title: lan.soft.php_main8, apache24: true, php53: true },
                        { type: 'get_php_session', val: ver, title: lan.soft.php_main9, apache24: true, php53: true },
                        { type: 'get_fpm_logs', val: ver, title: lan.soft.log, apache24: true, php53: true },
                        { type: 'get_slow_logs', val: ver, title: lan.public.slow_log, apache24: true, php53: true },
                        { type: 'get_phpinfo', val: ver, title: 'phpinfo' }
                    ]

                    var phpSort = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
                    for (var i = 0; i < phpSort.length; i++) {
                        var item = opt_list[i];
                        if (item) {
                            if (item.os == undefined || item['os'] == bt.os) {
                                if (name.indexOf("5.2") >= 0 && item.php53) continue;
                                var apache24 = item.apache24 ? 'class="apache24"' : '';
                                menu.append($('<p data-id="' + i + '" ' + apache24 + ' onclick="soft.get_tab_contents(\'' + item.type + '\',this)" >' + item.title + '</p>').data('item', item))
                            }
                        }
                    }
                }
                else {
                    menu.append(soft.get_config_menu(name));
                }
                $(".bt-w-menu p").click(function () {
                    $(this).addClass("bgw").siblings().removeClass("bgw");
                });
                $(".bt-w-menu p:eq(0)").trigger("click");
                bt.soft.get_soft_find('apache', function (rdata) {
                    if (rdata.setup) {
                        if (rdata.version.indexOf('2.2') >= 0) {
                            $(".apache24").hide();
                            $(".bt_server").remove();
                            $(".bt-w-menu p:eq(0)").trigger("click");
                        }
                    }
                })
            }, 100)
        })
    },
    get_tab_contents: function (key, obj) //获取设置菜单操作
    {
        var data = $(obj).parents('.bt-soft-menu').data('data');
        var version = data.name;
        if (data.name.indexOf('php-') >= 0) version = data.name.split('-')[1].replace('.', '');
        switch (key) {
            case 'service':

                var tabCon = $(".soft-man-con").empty();
                var status_list = [
                    { opt: data.status ? 'stop' : 'start', title: data.status ? lan.soft.stop : lan.soft.start },
                    { opt: 'restart', title: lan.soft.restart },
                    { opt: 'reload', title: lan.soft.reload }
                ]
                var btns = $('<div class="sfm-opt"></div>');
                for (var i = 0; i < status_list.length; i++)  btns.append('<button class="btn btn-default btn-sm" onclick="bt.pub.set_server_status(\'' + data.name + '\',\'' + status_list[i].opt + '\')">' + status_list[i].title + '</button>');
                tabCon.append('<p class="status">' + lan.soft.status + '：<span>' + (data.status ? lan.soft.on : lan.soft.off) + '</span><span style="color: ' + (data.status ? '#20a53a;' : 'red;') + ' margin-left: 3px;" class="glyphicon ' + (data.status ? 'glyphicon glyphicon-play' : 'glyphicon-pause') + '"></span></p');
                tabCon.append(btns);

                var help = '<ul class="help-info-text c7 mtb15" style="padding-top:30px"><li>' + lan.soft.mysql_mem_err + '</li></ul>';
                if (name == 'mysqld') tabCon.append(help);
                break;
            case 'config':
                var tabCon = $(".soft-man-con").empty();
                tabCon.append('<p style="color: #666; margin-bottom: 7px">' + lan.bt.edit_ps + '</p>');
                tabCon.append('<textarea class="bt-input-text" style="height: 320px; line-height:18px;" id="textBody"></textarea>')
                tabCon.append('<button id="OnlineEditFileBtn" class="btn btn-success btn-sm" style="margin-top:10px;">' + lan.public.save + '</button>')
                tabCon.append(bt.render_help([lan.get('config_edit_ps', [version])]))

                var fileName = bt.soft.get_config_path(version);
                var loadT = bt.load(lan.soft.get);
                bt.send('GetFileBody', 'files/GetFileBody', { path: fileName }, function (rdata) {
                    loadT.close();
                    $("#textBody").text(rdata.data);
                    $(".CodeMirror").remove();
                    var editor = CodeMirror.fromTextArea(document.getElementById("textBody"), {
                        extraKeys: { "Ctrl-Space": "autocomplete" },
                        lineNumbers: true,
                        matchBrackets: true,
                    });
                    editor.focus();
                    $(".CodeMirror-scroll").css({ "height": "350px", "margin": 0, "padding": 0 });
                    $("#OnlineEditFileBtn").click(function () {
                        $("#textBody").text(editor.getValue());
                        bt.soft.save_config(fileName, editor.getValue())
                    });
                })
                break;
            case 'change_version':
                var _list = [];
                for (var i = 0; i < data.versions.length; i++)  _list.push({ value: data.name + ' ' + data.versions[i].m_version, title: data.name + ' ' + data.versions[i].m_version });
                var _form_data = {
                    title: lan.soft.select_version, items: [
                        { name: 'phpVersion', width: '160px', type: 'select', items: _list },
                        {
                            name: 'btn_change_version', type: 'button', text: lan.soft.version_to, callback: function (ldata) {
                                if (data.name == 'mysql') {
                                    bt.database.get_list(1, '', function (ddata) {
                                        if (ddata.data.length > 0) {
                                            bt.msg({ msg: lan.soft.mysql_d, icon: 5, time: 5000 })
                                            return;
                                        }
                                        bt.soft.install_soft(data, ldata.phpVersion.split(" ")[1], 0);
                                    })
                                }
                                else {
                                    bt.soft.install_soft(data, ldata.phpVersion.split(" ")[1], 0);
                                }
                            }
                        }
                    ]
                }
                bt.render_form_line(_form_data, '', $(".soft-man-con").empty())
                break;
            case 'change_data_path':
                bt.send('GetMySQLInfo', 'database/GetMySQLInfo', {}, function (rdata) {
                    var form_data = {
                        items: [
                            { type: 'text', name: 'datadir', value: rdata.datadir, event: { css: 'glyphicon-folder-open', callback: function (obj) { bt.select_path(obj); } } },
                            {
                                name: 'btn_change_path', type: 'button', text: lan.soft.mysql_to, callback: function (ldata) {
                                    var loadT = bt.load(lan.soft.mysql_to_msg1);
                                    bt.send('SetDataDir', 'database/SetDataDir', { datadir: ldata.datadir }, function (rdata) {
                                        loadT.close();
                                        bt.msg(rdata);
                                    });
                                }
                            }
                        ]
                    }
                    bt.render_form_line(form_data, '', $(".soft-man-con").empty());
                });
                break;
            case 'change_mysql_port':
                bt.send('GetMySQLInfo', 'database/GetMySQLInfo', {}, function (rdata) {
                    var form_data = {
                        items: [
                            { type: 'text', width: '100px', name: 'port', value: rdata.port },
                            {
                                name: 'btn_change_port', type: 'button', text: lan.public.edit, callback: function (ldata) {
                                    var loadT = bt.load();
                                    bt.send('SetMySQLPort', 'database/SetMySQLPort', { port: ldata.port }, function (rdata) {
                                        loadT.close();
                                        bt.msg(rdata);
                                    });
                                }
                            }
                        ]
                    }
                    bt.render_form_line(form_data, '', $(".soft-man-con").empty());
                });
                break;
            case 'get_mysql_run_status':
                bt.send('GetRunStatus', 'database/GetRunStatus', {}, function (rdata) {
                    var cache_size = ((parseInt(rdata.Qcache_hits) / (parseInt(rdata.Qcache_hits) + parseInt(rdata.Qcache_inserts))) * 100).toFixed(2) + '%';
                    if (cache_size == 'NaN%') cache_size = 'OFF';
					var title10 = ((1 - rdata.Threads_created / rdata.Connections) * 100).toFixed(2);
					var title11 = ((1 - rdata.Key_reads / rdata.Key_read_requests) * 100).toFixed(2);
					var title12 = ((1 - rdata.Innodb_buffer_pool_reads / rdata.Innodb_buffer_pool_read_requests) * 100).toFixed(2);
					var title14 = ((rdata.Created_tmp_disk_tables / rdata.Created_tmp_tables) * 100).toFixed(2);
                    var Con = '<div class="divtable"><table class="table table-hover table-bordered" style="width: 490px;margin-bottom:10px;background-color:#fafafa">\
								<tbody>\
									<tr><th>'+ lan.soft.mysql_status_title1 + '</th><td>' + getLocalTime(rdata.Run) + '</td><th>' + lan.soft.mysql_status_title5 + '</th><td>' + parseInt(rdata.Questions / rdata.Uptime) + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title2 + '</th><td>' + rdata.Connections + '</td><th>' + lan.soft.mysql_status_title6 + '</th><td>' + parseInt((parseInt(rdata.Com_commit) + parseInt(rdata.Com_rollback)) / rdata.Uptime) + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title3 + '</th><td>' + ToSize(rdata.Bytes_sent) + '</td><th>' + lan.soft.mysql_status_title7 + '</th><td>' + rdata.File + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title4 + '</th><td>' + ToSize(rdata.Bytes_received) + '</td><th>' + lan.soft.mysql_status_title8 + '</th><td>' + rdata.Position + '</td></tr>\
								</tbody>\
								</table>\
								<table class="table table-hover table-bordered" style="width: 490px;">\
								<thead style="display:none;"><th></th><th></th><th></th><th></th></thead>\
								<tbody>\
									<tr><th>'+ lan.soft.mysql_status_title9 + '</th><td>' + rdata.Threads_running + '/' + rdata.Max_used_connections + '</td><td colspan="2">' + lan.soft.mysql_status_ps1 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title10 + '</th><td>' + (!isNaN(title10)?title10:'0') + '%</td><td colspan="2">' + lan.soft.mysql_status_ps2 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title11 + '</th><td>' + (!isNaN(title11)?title11:'0') + '%</td><td colspan="2">' + lan.soft.mysql_status_ps3 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title12 + '</th><td>' + (!isNaN(title12)?title12:'0') + '%</td><td colspan="2">' + lan.soft.mysql_status_ps4 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title13 + '</th><td>' + cache_size + '</td><td colspan="2">' + lan.soft.mysql_status_ps5 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title14 + '</th><td>' + (!isNaN(title14)?title14:'0') + '%</td><td colspan="2">' + lan.soft.mysql_status_ps6 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title15 + '</th><td>' + rdata.Open_tables + '</td><td colspan="2">' + lan.soft.mysql_status_ps7 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title16 + '</th><td>' + rdata.Select_full_join + '</td><td colspan="2">' + lan.soft.mysql_status_ps8 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title17 + '</th><td>' + rdata.Select_range_check + '</td><td colspan="2">' + lan.soft.mysql_status_ps9 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title18 + '</th><td>' + rdata.Sort_merge_passes + '</td><td colspan="2">' + lan.soft.mysql_status_ps10 + '</td></tr>\
									<tr><th>'+ lan.soft.mysql_status_title19 + '</th><td>' + rdata.Table_locks_waited + '</td><td colspan="2">' + lan.soft.mysql_status_ps11 + '</td></tr>\
								<tbody>\
						</table></div>'
                    $(".soft-man-con").html(Con);
                })
                break;
            case 'get_mysql_status':
                bt.send('GetDbStatus', 'database/GetDbStatus', {}, function (rdata) {
                    var key_buffer_size = bt.format_size(rdata.mem.key_buffer_size, false, 0, 'MB')
                    var query_cache_size = bt.format_size(rdata.mem.query_cache_size, false, 0, 'MB')
                    var tmp_table_size = bt.format_size(rdata.mem.tmp_table_size, false, 0, 'MB')
                    var innodb_buffer_pool_size = bt.format_size(rdata.mem.innodb_buffer_pool_size, false, 0, 'MB')
                    var innodb_additional_mem_pool_size = bt.format_size(rdata.mem.innodb_additional_mem_pool_size, false, 0, 'MB')
                    var innodb_log_buffer_size = bt.format_size(rdata.mem.innodb_log_buffer_size, false, 0, 'MB')

                    var sort_buffer_size = bt.format_size(rdata.mem.sort_buffer_size, false, 0, 'MB')
                    var read_buffer_size = bt.format_size(rdata.mem.read_buffer_size, false, 0, 'MB')
                    var read_rnd_buffer_size = bt.format_size(rdata.mem.read_rnd_buffer_size, false, 0, 'MB')
                    var join_buffer_size = bt.format_size(rdata.mem.join_buffer_size, false, 0, 'MB')
                    var thread_stack = bt.format_size(rdata.mem.thread_stack, false, 0, 'MB')
                    var binlog_cache_size = bt.format_size(rdata.mem.binlog_cache_size, false, 0, 'MB')
                    var a = key_buffer_size + query_cache_size + tmp_table_size + innodb_buffer_pool_size + innodb_additional_mem_pool_size + innodb_log_buffer_size
                    var b = sort_buffer_size + read_buffer_size + read_rnd_buffer_size + join_buffer_size + thread_stack + binlog_cache_size
                    var memSize = a + rdata.mem.max_connections * b

                    var mysql_select = {
                        '1': {
                            title: '1-2GB', data: {
                                key_buffer_size: 128,
                                query_cache_size: 64,
                                tmp_table_size: 64,
                                innodb_buffer_pool_size: 256,
                                sort_buffer_size: 768,
                                read_buffer_size: 768,
                                read_rnd_buffer_size: 512,
                                join_buffer_size: 1024,
                                thread_stack: 256,
                                binlog_cache_size: 64,
                                thread_cache_size: 64,
                                table_open_cache: 128,
                                max_connections: 100
                            }
                        },
                        '2': {
                            title: '2-4GB', data: {
                                key_buffer_size: 256,
                                query_cache_size: 128,
                                tmp_table_size: 384,
                                innodb_buffer_pool_size: 384,
                                sort_buffer_size: 768,
                                read_buffer_size: 768,
                                read_rnd_buffer_size: 512,
                                join_buffer_size: 2048,
                                thread_stack: 256,
                                binlog_cache_size: 64,
                                thread_cache_size: 96,
                                table_open_cache: 192,
                                max_connections: 200
                            }
                        },
                        '3': {
                            title: '4-8GB', data: {
                                key_buffer_size: 384,
                                query_cache_size: 192,
                                tmp_table_size: 512,
                                innodb_buffer_pool_size: 512,
                                sort_buffer_size: 1024,
                                read_buffer_size: 1024,
                                read_rnd_buffer_size: 768,
                                join_buffer_size: 2048,
                                thread_stack: 256,
                                binlog_cache_size: 128,
                                thread_cache_size: 128,
                                table_open_cache: 384,
                                max_connections: 300
                            }
                        },
                        '4': {
                            title: '8-16GB', data: {
                                key_buffer_size: 512,
                                query_cache_size: 256,
                                tmp_table_size: 1024,
                                innodb_buffer_pool_size: 1024,
                                sort_buffer_size: 2048,
                                read_buffer_size: 2048,
                                read_rnd_buffer_size: 1024,
                                join_buffer_size: 4096,
                                thread_stack: 384,
                                binlog_cache_size: 192,
                                thread_cache_size: 192,
                                table_open_cache: 1024,
                                max_connections: 400
                            }
                        },
                        '5': {
                            title: '16-32GB', data: {
                                key_buffer_size: 1024,
                                query_cache_size: 384,
                                tmp_table_size: 2048,
                                innodb_buffer_pool_size: 4096,
                                sort_buffer_size: 4096,
                                read_buffer_size: 4096,
                                read_rnd_buffer_size: 2048,
                                join_buffer_size: 8192,
                                thread_stack: 512,
                                binlog_cache_size: 256,
                                thread_cache_size: 256,
                                table_open_cache: 2048,
                                max_connections: 500
                            }
                        }

                    }
                    var mysql_arrs = [{ value: 0, title: lan.soft.mysql_set_select }]
                    for (var key in mysql_select) mysql_arrs.push({ value: key, title: mysql_select[key].title })

                    var form_datas = [
                        {
                            items: [
                                {
                                    title: lan.soft.mysql_set_msg, name: 'mysql_set', type: 'select', items: mysql_arrs, callback: function (item) {
                                        if (item.val() > 0) {
                                            var data = mysql_select[item.val()].data;
                                            for (var key in data) $('.' + key).val(data[key]);
                                            if (!data.query_cache_size) data['query_cache_size'] = 0;
                                            $("input[name='max_connections']").trigger('change')

                                        }
                                    }
                                },
                                { title: lan.soft.mysql_set_maxmem, name: 'memSize', width: '70px', disabled: true, value: memSize.toFixed(2), ps: 'MB' }
                            ]
                        },
                        { title: 'key_buffer_size', type: 'number', name: 'key_buffer_size', width: '70px', value: key_buffer_size, ps: 'MB, <font>' + lan.soft.mysql_set_key_buffer_size + '</font>' },
                        { title: 'query_cache_size', type: 'number', name: 'query_cache_size', width: '70px', value: query_cache_size, ps: 'MB, <font>' + lan.soft.mysql_set_query_cache_size + '</font>' },
                        { title: 'tmp_table_size', type: 'number', name: 'tmp_table_size', width: '70px', value: tmp_table_size, ps: 'MB, <font>' + lan.soft.mysql_set_tmp_table_size + '</font>' },
                        { title: 'innodb_buffer_pool_size', type: 'number', name: 'innodb_buffer_pool_size', value: innodb_buffer_pool_size, width: '70px', ps: 'MB, <font>' + lan.soft.mysql_set_innodb_buffer_pool_size + '</font>' },
                        { title: 'innodb_log_buffer_size', type: 'number', name: 'innodb_log_buffer_size', value: innodb_log_buffer_size, width: '70px', ps: 'MB, <font>' + lan.soft.mysql_set_innodb_log_buffer_size + '</font>' },
                        { title: 'sort_buffer_size', type: 'number', name: 'sort_buffer_size', width: '70px', value: (sort_buffer_size * 1024), ps: 'KB * ' + lan.soft.mysql_set_conn + ', <font>' + lan.soft.mysql_set_sort_buffer_size + '</font>' },
                        { title: 'read_buffer_size', type: 'number', name: 'read_buffer_size', width: '70px', value: (read_buffer_size * 1024), ps: 'KB * ' + lan.soft.mysql_set_conn + ', <font>' + lan.soft.mysql_set_read_buffer_size + '</font>' },
                        { title: 'read_rnd_buffer_size', type: 'number', name: 'read_rnd_buffer_size', width: '70px', value: (read_rnd_buffer_size * 1024), ps: 'KB * ' + lan.soft.mysql_set_conn + ', <font>' + lan.soft.mysql_set_read_rnd_buffer_size + '</font>' },
                        { title: 'join_buffer_size', type: 'number', name: 'join_buffer_size', width: '70px', value: (join_buffer_size * 1024), ps: 'KB * ' + lan.soft.mysql_set_conn + ', <font>' + lan.soft.mysql_set_join_buffer_size + '</font>' },
                        { title: 'thread_stack', type: 'number', name: 'thread_stack', width: '70px', value: (thread_stack * 1024), ps: 'KB * ' + lan.soft.mysql_set_conn + ', <font>' + lan.soft.mysql_set_thread_stack + '</font>' },
                        { title: 'binlog_cache_size', type: 'number', name: 'binlog_cache_size', value: (binlog_cache_size * 1024), width: '70px', ps: 'KB * ' + lan.soft.mysql_set_conn + ', <font>' + lan.soft.mysql_set_binlog_cache_size + '</font>' },
                        { title: 'thread_cache_size', type: 'number', name: 'thread_cache_size', value: rdata.mem.thread_cache_size, width: '70px', ps: lan.soft.mysql_set_thread_cache_size },
                        { title: 'table_open_cache', type: 'number', name: 'table_open_cache', value: rdata.mem.table_open_cache, width: '70px', ps: lan.soft.mysql_set_table_open_cache },
                        { title: 'max_connections', type: 'number', name: 'max_connections', value: rdata.mem.max_connections, width: '70px', ps: lan.soft.mysql_set_max_connections },
                        {
                            items: [
                                {
                                    text: lan.soft.mysql_set_restart, type: 'button', name: 'bt_mysql_restart', callback: function (ldata) {
                                        bt.pub.set_server_status('mysqld', 'restart');
                                    }
                                },
                                {
                                    text: lan.public.save, type: 'button', name: 'bt_mysql_save', callback: function (ldata) {
                                        ldata.query_cache_type = 0;
                                        if (ldata.query_cache_size > 0) ldata.query_cache_type = 1;
                                        ldata['max_heap_table_size'] = ldata.tmp_table_size;
                                        bt.send('SetDbConf', 'database/SetDbConf', ldata, function (rdata) {
                                            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
                                        });
                                    }
                                }
                            ]
                        }
                    ]
                    var tabCon = $(".soft-man-con").empty().append("<div class='tab-db-status'></div>");
                    for (var i = 0; i < form_datas.length; i++) {
                        bt.render_form_line(form_datas[i], '', $('.tab-db-status'));
                    }

                    $(".tab-db-status input[name*='size'],.tab-db-status input[name='max_connections'],.tab-db-status input[name='thread_stack']").change(function () {

                        var key_buffer_size = parseInt($("input[name='key_buffer_size']").val());
                        var query_cache_size = parseInt($("input[name='query_cache_size']").val());
                        var tmp_table_size = parseInt($("input[name='tmp_table_size']").val());
                        var innodb_buffer_pool_size = parseInt($("input[name='innodb_buffer_pool_size']").val());
                        var innodb_log_buffer_size = parseInt($("input[name='innodb_log_buffer_size']").val());

                        var sort_buffer_size = $("input[name='sort_buffer_size']").val() / 1024;
                        var read_buffer_size = $("input[name='read_buffer_size']").val() / 1024;
                        var read_rnd_buffer_size = $("input[name='read_rnd_buffer_size']").val() / 1024;
                        var join_buffer_size = $("input[name='join_buffer_size']").val() / 1024;
                        var thread_stack = $("input[name='thread_stack']").val() / 1024;
                        var binlog_cache_size = $("input[name='binlog_cache_size']").val() / 1024;
                        var max_connections = $("input[name='max_connections']").val();

                        var a = key_buffer_size + query_cache_size + tmp_table_size + innodb_buffer_pool_size + innodb_additional_mem_pool_size + innodb_log_buffer_size
                        var b = sort_buffer_size + read_buffer_size + read_rnd_buffer_size + join_buffer_size + thread_stack + binlog_cache_size
                        var memSize = a + max_connections * b
                        $("input[name='memSize']").val(memSize.toFixed(2));
                    });
                })
                break;
            case 'mysql_log':
                var loadT = bt.load();
                bt.send('BinLog', 'database/BinLog', { status: 1 }, function (rdata) {
                    loadT.close();
                    var limitCon = '<p class="conf_p">\
										<span class="f14 c6 mr20">'+ lan.soft.mysql_log_bin + ' </span><span class="f14 c6 mr20">' + ToSize(rdata.msg) + '</span>\
										<button class="btn btn-success btn-xs btn-bin va0">'+ (rdata.status ? lan.soft.off : lan.soft.on) + '</button>\
										<p class="f14 c6 mtb10" style="border-top:#ddd 1px solid; padding:10px 0">'+ lan.soft.mysql_log_err + '<button class="btn btn-default btn-clear btn-xs" style="float:right;" >' + lan.soft.mysql_log_close + '</button></p>\
										<textarea readonly style="margin: 0px;width: 515px;height: 440px;background-color: #333;color:#fff; padding:0 5px" id="error_log"></textarea>\
									</p>'
                    $(".soft-man-con").html(limitCon);

                    //设置二进制日志
                    $(".btn-bin").click(function () {
                        var loadT = layer.msg(lan.public.the, { icon: 16, time: 0, shade: 0.3 });
                        $.post('/database?action=BinLog', "", function (rdata) {
                            layer.close(loadT);
                            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
                            soft.get_tab_contents('mysql_log')
                        });
                    })

                    //清空日志
                    $(".btn-clear").click(function () {
                        var loadT = layer.msg(lan.public.the, { icon: 16, time: 0, shade: 0.3 });
                        $.post('/database?action=GetErrorLog', "close=1", function (rdata) {
                            layer.close(loadT);
                            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
                            soft.get_tab_contents('mysql_log')
                        });
                    })
                    bt.send('GetErrorLog', 'database/GetErrorLog', {}, function (error_body) {
                        if (error_body.status === false) {
                            layer.msg(error_body.msg, { icon: 5 });
                            error_body = lan.soft.mysql_log_ps1;
                        }
                        if (error_body == "") error_body = lan.soft.mysql_log_ps1;
                        $("#error_log").text(error_body);
                        var ob = document.getElementById('error_log');
                        ob.scrollTop = ob.scrollHeight;
                    });
                })
                break;
            case 'mysql_slow_log':
                var loadT = bt.load();
                bt.send('GetSlowLogs', 'database/GetSlowLogs', {}, function (logs) {
                    loadT.close();
                    if (!logs.status) {
                        logs.msg = '';
                    }
                    if (logs.msg == '') logs.msg = '当前没有慢日志.';
                    var phpCon = '<textarea readonly="" style="margin: 0px;width: 500px;height: 520px;background-color: #333;color:#fff; padding:0 5px" id="error_log">' + logs.msg + '</textarea>';
                    $(".soft-man-con").html(phpCon);
                    var ob = document.getElementById('error_log');
                    ob.scrollTop = ob.scrollHeight;
                })
                break;
            case 'log':
                var loadT = bt.load(lan.public.the_get);
                bt.send('GetOpeLogs', 'ajax/GetOpeLogs', { path: '/www/wwwlogs/nginx_error.log' }, function (rdata) {
                    loadT.close();
                    if (rdata.msg == '') rdata.msg = '当前没有日志!';
                    var ebody = '<div class="soft-man-con"><textarea readonly="" style="margin: 0px;width: 500px;height: 520px;background-color: #333;color:#fff; padding:0 5px" id="error_log">' + rdata.msg + '</textarea></div>';
                    $(".soft-man-con").html(ebody);
                    var ob = document.getElementById('error_log');
                    ob.scrollTop = ob.scrollHeight;
                })
                break;
            case 'nginx_status':
                var loadT = bt.load();
                bt.send('GetNginxStatus', 'ajax/GetNginxStatus', {}, function (rdata) {
                    loadT.close();
                    $(".soft-man-con").html("<div><table id='tab-nginx-status' class='table table-hover table-bordered'> </table></div>");
                    var arrs = []
                    arrs[lan.bt.nginx_active] = rdata.active;
                    arrs[lan.bt.nginx_accepts] = rdata.accepts;
                    arrs[lan.bt.nginx_handled] = rdata.handled;
                    arrs[lan.bt.nginx_requests] = rdata.requests;
                    arrs[lan.bt.nginx_reading] = rdata.Reading;
                    arrs[lan.bt.nginx_writing] = rdata.Writing;
                    arrs[lan.bt.nginx_waiting] = rdata.Waiting;
                    arrs[lan.bt.nginx_worker] = rdata.worker;
                    arrs[lan.bt.nginx_workercpu] = rdata.workercpu;
                    arrs[lan.bt.nginx_workermen] = rdata.workermen;
                    bt.render_table("tab-nginx-status", arrs);
                })
            break;
            case 'apache_status':
                var loadT = bt.load();
                bt.send('GetApacheStatus', 'ajax/GetApacheStatus', {}, function (rdata) {
                    loadT.close();
                    $(".soft-man-con").html("<div><table id='tab-Apache-status' class='table table-hover table-bordered'> </table></div>");
                    var arrs = []
                    arrs[lan.bt.apache_uptime] = rdata.UpTime;
                    arrs[lan.bt.apache_idleworkers] = rdata.IdleWorkers;
                    arrs[lan.bt.apache_totalaccesses] = rdata.TotalAccesses;
                    arrs[lan.bt.apache_totalkbytes] = rdata.TotalKBytes;
                    arrs[lan.bt.apache_workermem] = rdata.workermem;
                    arrs[lan.bt.apache_workercpu] = rdata.workercpu;
                    arrs[lan.bt.apache_reqpersec] = rdata.ReqPerSec;
                    arrs[lan.bt.apache_restarttime] = rdata.RestartTime;
                    arrs[lan.bt.apache_busyworkers] = rdata.BusyWorkers;
                    bt.render_table("tab-Apache-status", arrs);
                })
            break;
            case 'nginx_set':
                var loadT = bt.load();
                bt.send('GetNginxValue', 'config/GetNginxValue', {}, function (rdata) {
                    loadT.close();
                    var form_datas = []
                    for(var i = 0; i < rdata.length; i++){
                        if(rdata[i].name == 'worker_processes'){
                            form_datas.push({title: rdata[i].name, name: rdata[i].name,width: '60px',value: rdata[i].value,ps: rdata[i].ps,text:''})
                        }else if(rdata[i].name == 'gzip'){
                            form_datas.push({title: rdata[i].name,type: 'select',items:[{title:'开启',value:'on'},{title:'关闭',value:'off'}],name: rdata[i].name,width: '60px',value: rdata[i].value,ps: rdata[i].ps,text:''})
                        }else{
                            form_datas.push({title: rdata[i].name,type: 'number', name: rdata[i].name,width: '60px',value: rdata[i].value,ps: rdata[i].ps,text:''})
                        }
                            
                    }
                    form_datas.push({
                        items: [{
                            text: lan.public.save, type: 'button', name: 'bt_nginx_save', callback: function (item) {
                                    delete item['bt_nginx_save']
                                    bt.send('SetNginxValue','config/SetNginxValue',item, function (rdata) {
                                        layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
                                    });
                                }
                            }
                        ]
                    })
                    $(".soft-man-con").empty().append('<div class="set_nginx_config"></div>');
                    for (var i = 0; i < form_datas.length; i++) {
                        bt.render_form_line(form_datas[i], '', $(".soft-man-con .set_nginx_config"));
                    }
                });
            break;
            case 'apache_set':
                var loadT = bt.load();
                bt.send('GetNginxValue', 'config/GetApacheValue', {}, function (rdata) {
                    loadT.close();
                    var form_datas = []
                    for(var i = 0; i < rdata.length; i++){
                        if(rdata[i].name == 'KeepAlive'){
                            form_datas.push({title: rdata[i].name,type: 'select',items:[{title:'开启',value:'on'},{title:'关闭',value:'off'}],name: rdata[i].name,width: '60px',value: rdata[i].value,ps: rdata[i].ps,text:''})
                        }else{
                            form_datas.push({title: rdata[i].name,type: 'number', name: rdata[i].name,width: '60px',value: rdata[i].value,ps: rdata[i].ps,text:''})
                        }
                            
                    }
                    form_datas.push({
                        items: [{
                            text: lan.public.save, type: 'button', name: 'bt_apache_save', callback: function (item) {
                                    delete item['bt_apache_save'];
                                    console.log(item)
                                    bt.send('SetApacheValue','config/SetApacheValue',item, function (rdata) {
                                        layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
                                    });
                                }
                            }
                        ]
                    })
                    $(".soft-man-con").empty().append('<div class="set_Apache_config"></div>');
                    for (var i = 0; i < form_datas.length; i++) {
                        bt.render_form_line(form_datas[i], '', $(".soft-man-con .set_Apache_config"));
                    }
                });
            break;
            case 'memcached_status':
            case 'memcached_set':
                var loadT = bt.load(lan.public.get_the);
                bt.send('GetMemcachedStatus', 'ajax/GetMemcachedStatus', {}, function (rdata) {
                    loadT.close();
                    if (key == 'memcached_set') {
                        var form_data = [
                            { title: 'BindIP', name: 'ip', width: '120px', value: rdata.bind, ps: '监听IP,请勿随意修改' },
                            { title: 'PORT', name: 'port', type: 'number', width: '120px', value: rdata.port, ps: '监听端口,一般无需修改' },
                            { title: 'CACHESIZE', name: 'cachesize', type: 'number', width: '120px', value: rdata.cachesize, ps: 'MB,<font>缓存大小,建议不要大于512M</font>' },
                            { title: 'MAXCONN', name: 'maxconn', type: 'number', width: '120px', value: rdata.maxconn, ps: '最大连接数,建议不要大于40960' },
                            {
                                title: ' ', items: [{
                                    text: lan.public.save, name: 'btn_set_memcached', type: 'button', callback: function (ldata) {
                                        if (ldata.ip.split('.').length < 4) {
                                            layer.msg('IP地址格式不正确!', { icon: 2 });
                                            return;
                                        }
                                        if (ldata.port < 1 || ldata.port > 65535) {
                                            layer.msg('端口范围不正确!', { icon: 2 });
                                            return;
                                        }
                                        if (ldata.cachesize < 8) {
                                            layer.msg('缓存值过小', { icon: 2 });
                                            return;
                                        }
                                        if (ldata.maxconn < 4) {
                                            layer.msg('最大连接数过小', { icon: 2 });
                                            return;
                                        }
                                        var loadT = bt.load(lan.public.the);
                                        bt.send('SetMemcachedCache', 'ajax/SetMemcachedCache', ldata, function (rdata) {
                                            loadT.close();
                                            bt.msg(rdata)
                                        });
                                    }
                                }]
                            }
                        ]
                        var tabCon = $(".soft-man-con").empty();
                        for (var i = 0; i < form_data.length; i++) {
                            bt.render_form_line(form_data[i], '', tabCon);
                        }
                        return;
                    }
                    else {
                        var arr = {};
                        arr['BindIP'] = [rdata.bind, '监听IP'];
                        arr['PORT'] = [rdata.port, '监听端口'];
                        arr['CACHESIZE'] = [rdata.cachesize + ' MB', '最大缓存容量'];
                        arr['MAXCONN'] = [rdata.maxconn, '最大连接数限制'];
                        arr['curr_connections'] = [rdata.curr_connections, '当前打开的连接数'];
                        arr['cmd_get'] = [rdata.cmd_get, 'GET请求数'];
                        arr['get_hits'] = [rdata.get_hits, 'GET命中次数'];
                        arr['get_misses'] = [rdata.get_misses, 'GET失败次数'];
                        arr['hit'] = [rdata.hit.toFixed(2) + ' %', 'GET命中率'];
                        arr['curr_items'] = [rdata.curr_items, '当前被缓存的数据行数'];
                        arr['evictions'] = [rdata.evictions, '因内存不足而被清理的缓存行数'];
                        arr['bytes'] = [ToSize(rdata.bytes), '当前已使用内存'];
                        arr['bytes_read'] = [ToSize(rdata.bytes_read), '请求总大小'];
                        arr['bytes_written'] = [ToSize(rdata.bytes_written), '发送总大小'];

                        var con = "<div class=\"divtable\"><table id='tab_memcached_status' style=\"width: 490px;\" class='table table-hover table-bordered '><thead><th>字段</th><th>当前值</th><th>说明</th></thead></table></div>";
                        $(".soft-man-con").html(con);
                        bt.render_table('tab_memcached_status', arr, true);
                    }
                })
                break;
            case 'phpmyadmin_php':
                bt.send('GetPHPVersion', 'site/GetPHPVersion', {}, function (rdata) {
                    var sdata = $('.bt-soft-menu').data('data');

                    var body = "<div class='ver line'><span class='tname'>" + lan.soft.php_version + "</span><select id='get_phpVersion' class='bt-input-text mr20' name='phpVersion' style='width:110px'>";
                    for (var i = 0; i < rdata.length; i++) {
                        optionSelect = rdata[i].version == sdata.ext.phpversion ? 'selected' : '';
                        body += "<option value='" + rdata[i].version + "' " + optionSelect + ">" + rdata[i].name + "</option>"
                    }
                    body += '</select><button class="btn btn-success btn-sm" >' + lan.public.save + '</button></div>';
                    $(".soft-man-con").html(body);
                    $('.btn-success').click(function () {
                        var loadT = bt.load(lan.public.the);
                        bt.send('setPHPMyAdmin', 'ajax/setPHPMyAdmin', { phpversion: $("#get_phpVersion").val() }, function (rdata) {
                            loadT.close();
                            bt.msg(rdata);
                            if (rdata.status) {
                                setTimeout(function () {
                                    window.location.reload();
                                }, 3000);
                            }
                        })
                    })
                })
                break;
            case 'phpmyadmin_safe':
                var sdata = $('.bt-soft-menu').data('data');
                var con = '<div class="ver line">\
									<span style="margin-right:10px">'+ lan.soft.pma_port + '</span>\
									<input class="bt-input-text phpmyadmindk mr20" name="Name" id="pmport" value="'+ sdata.ext.port + '" placeholder="' + lan.soft.pma_port_title + '" maxlength="5" type="number">\
									<button class="btn btn-success btn-sm phpmyadmin_port" >'+ lan.public.save + '</button>\
								</div>\
								<div class="user_pw_tit">\
									<span class="tit">'+ lan.soft.pma_pass + '</span>\
									<span class="btswitch-p"><input class="btswitch btswitch-ios" id="phpmyadminsafe" type="checkbox" '+ (sdata.ext.auth ? 'checked' : '') + '>\
									<label class="btswitch-btn phpmyadmin-btn phpmyadmin_safe" for="phpmyadminsafe" ></label>\
									</span>\
								</div>\
								<div class="user_pw">\
									<p><span>'+ lan.soft.pma_user + '</span><input id="username_get" class="bt-input-text" name="username_get" value="" type="text" placeholder="' + lan.soft.edit_empty + '"></p>\
									<p><span>'+ lan.soft.pma_pass1 + '</span><input id="password_get_1" class="bt-input-text" name="password_get_1" value="" type="password" placeholder="' + lan.soft.edit_empty + '"></p>\
									<p><span>'+ lan.soft.pma_pass2 + '</span><input id="password_get_2" class="bt-input-text" name="password_get_1" value="" type="password" placeholder="' + lan.soft.edit_empty + '"></p>\
									<p><button class="btn btn-success btn-sm phpmyadmin_safe_save" >'+ lan.public.save + '</button></p>\
								</div>\
								<ul class="help-info-text c7"><li>'+ lan.soft.pma_ps + '</li></ul>';
                $(".soft-man-con").html(con);
                if (sdata.ext.port) {
                    $(".user_pw").show();
                }
                $('.phpmyadmin_port').click(function () {
                    var pmport = $("#pmport").val();
                    if (!bt.check_port(pmport)) {
                        layer.msg(lan.firewall.port_err, { icon: 2 });
                        return;
                    }
                    var loadT = bt.load(lan.public.the);
                    bt.send('setPHPMyAdmin', 'ajax/setPHPMyAdmin', { port: pmport }, function (rdata) {
                        loadT.close();
                        bt.msg(rdata);
                    })
                })
                $('.phpmyadmin_safe').click(function () {
                    var stat = $("#phpmyadminsafe").prop("checked");
                    if (stat) {
                        $(".user_pw").hide();
                        set_phpmyadmin('close');
                    } else {
                        $(".user_pw").show();
                    }
                })
                $('.phpmyadmin_safe_save').click(function () {
                    set_phpmyadmin('get');
                })

                function set_phpmyadmin(msg) {
                    var type = 'password';
                    if (msg == 'close') {
                        bt.confirm({ msg: lan.soft.pma_pass_close }, function () {
                            var loading = bt.load(lan.public.the);
                            bt.send('setPHPMyAdmin', 'ajax/setPHPMyAdmin', { password: msg, siteName: 'phpmyadmin' }, function (rdata) {
                                loading.close();
                                bt.msg(rdata);
                            })
                        })
                        return;
                    } else {
                        username = $("#username_get").val()
                        password_1 = $("#password_get_1").val()
                        password_2 = $("#password_get_2").val()
                        if (username.length < 1 || password_1.length < 1) {
                            bt.msg({ msg: lan.soft.pma_pass_empty, icon: 2 })
                            return;
                        }
                        if (password_1 != password_2) {
                            bt.msg({ msg: lan.soft.pass_err_re, icon: 2 })
                            return;
                        }
                    }
                    var loading = bt.load(lan.public.the);
                    bt.send('setPHPMyAdmin', 'ajax/setPHPMyAdmin', { password: password_1, username: username, siteName: 'phpmyadmin' }, function (rdata) {
                        loading.close();
                        bt.msg(rdata);
                    })
                }
                break;
            case 'set_php_config':

                bt.soft.php.get_config(version, function (rdata) {
                    $(".soft-man-con").empty().append('<div class="divtable" id="phpextdiv" style="margin-right:10px;height: 420px; overflow: auto; margin-right: 0px;"><table id="tab_phpext" class="table table-hover" width="100%" cellspacing="0" cellpadding="0" border="0"></div></div>');

                    var list = [];
                    for (var i = 0; i < rdata.libs.length; i++) {
                        if (rdata.libs[i].versions.indexOf(version) == -1) continue;
                        list.push(rdata.libs[i]);
                    }
                    var _tab = bt.render({
                        table: '#tab_phpext',
                        data: list,
                        columns: [
                            { field: 'name', title: lan.soft.php_ext_name },
                            { field: 'type', title: lan.soft.php_ext_type, width: 64 },
                            { field: 'msg', title: lan.soft.php_ext_ps },
                            {
                                field: 'status', title: lan.soft.php_ext_status, width: 40, templet: function (item) {
                                    return '<span class="ico-' + (item.status ? 'start' : 'stop') + ' glyphicon glyphicon-' + (item.status ? 'ok' : 'remove') + '"></span>'
                                }
                            },
                            {
                                field: 'opt', title: lan.public.action, width: 50, templet: function (item) {
                                    var opt = '<a class="btlink lib-install" data-name="' + item.name + '" data-title="' + item.title + '"  href="javascript:;">' + lan.soft.install + '</a>'
                                    if (item['task'] == '-1' && item.phpversions.indexOf(version) != -1) {
                                        opt = '<a style="color:green;" href="javascript:messagebox();">' + lan.soft.the_install + '</a>'
                                    } else if (item['task'] == '0' && item.phpversions.indexOf(version) != -1) {
                                        opt = '<a style="color:#C0C0C0;" href="javascript:messagebox();">' + lan.soft.sleep_install + '</a>'
                                    } else if (item.status) {
                                        opt = '<a style="color:red;" data-name="' + item.name + '" data-title="' + item.title + '" class="lib-uninstall" href="javascript:;">' + lan.soft.uninstall + '</a>'
                                    }
                                    return opt;
                                }
                            },
                        ]
                    })
                    var helps = ['请按实际需求安装扩展,不要安装不必要的PHP扩展,这会影响PHP执行效率,甚至出现异常', 'opcache/xcache/apc等脚本缓存扩展,请只安装其中1个,否则可能导致您的站点程序异常']
                    $(".soft-man-con").append(bt.render_help(helps));

                    var divObj = document.getElementById('phpextdiv');
                    var scrollTopNum = 0;
                    if (divObj) scrollTopNum = divObj.scrollTop;
                    document.getElementById('phpextdiv').scrollTop = scrollTopNum;
                    $('a').click(function () {
                        var _obj = $(this);
                        if (_obj.hasClass('lib-uninstall')) {
                            bt.soft.php.un_install_php_lib(version, _obj.attr('data-name'), _obj.attr('data-title'), function (rdata) {
                                setTimeout(function () {
                                    soft.get_tab_contents('set_php_config', obj);
                                }, 1000)
                            });
                        }
                        else if (_obj.hasClass('lib-install')) {
                            bt.soft.php.install_php_lib(version, _obj.attr('data-name'), _obj.attr('data-title'), function (rdata) {
                                setTimeout(function () {
                                    soft.get_tab_contents('set_php_config', obj);
                                }, 1000)
                            });
                        }
                    })
                })
                break;
            case 'get_phpinfo':
                var con = '<button id="btn_phpinfo" class="btn btn-default btn-sm" >' + lan.soft.phpinfo + '</button>';
                $(".soft-man-con").html(con);

                $('#btn_phpinfo').click(function () {
                    var loadT = bt.load(lan.soft.get);
                    bt.send('GetPHPInfo', 'ajax/GetPHPInfo', { version: version }, function (rdata) {
                        loadT.close();
                        bt.open({
                            type: 1,
                            title: "PHP-" + version + "-PHPINFO",
                            area: ['70%', '90%'],
                            closeBtn: 2,
                            shadeClose: true,
                            content: rdata.replace('a:link {color: #009; text-decoration: none; background-color: #fff;}', '').replace('a:link {color: #000099; text-decoration: none; background-color: #ffffff;}', '')
                        })
                    })
                })
                break;
            case 'config_edit':
                bt.soft.php.get_php_config(version, function (rdata) {
                    var mlist = '';
                    for (var i = 0; i < rdata.length; i++) {
                        var w = '70'
                        if (rdata[i].name == 'error_reporting') w = '250';
                        var ibody = '<input style="width: ' + w + 'px;" class="bt-input-text mr5" name="' + rdata[i].name + '" value="' + rdata[i].value + '" type="text" >';
                        switch (rdata[i].type) {
                            case 0:
                                var selected_1 = (rdata[i].value == 1) ? 'selected' : '';
                                var selected_0 = (rdata[i].value == 0) ? 'selected' : '';
                                ibody = '<select class="bt-input-text mr5" name="' + rdata[i].name + '" style="width: ' + w + 'px;"><option value="1" ' + selected_1 + '>开启</option><option value="0" ' + selected_0 + '>关闭</option></select>'
                                break;
                            case 1:
                                var selected_1 = (rdata[i].value == 'On') ? 'selected' : '';
                                var selected_0 = (rdata[i].value == 'Off') ? 'selected' : '';
                                ibody = '<select class="bt-input-text mr5" name="' + rdata[i].name + '" style="width: ' + w + 'px;"><option value="On" ' + selected_1 + '>开启</option><option value="Off" ' + selected_0 + '>关闭</option></select>'
                                break;
                        }
                        mlist += '<p><span>' + rdata[i].name + '</span>' + ibody + ', <font>' + rdata[i].ps + '</font></p>'
                    }
                    var tabCon = $(".soft-man-con").empty()
                    tabCon.append('<div class="conf_p">' + mlist + '</div></div>')
                    var datas = {
                        title: ' ',
                        items: [{
                            name: 'btn_fresh', text: lan.public.fresh, type: 'button', callback: function (ldata) {
                                soft.get_tab_contents(key, obj);
                            }
                        },
                        {
                            name: 'btn_save', text: lan.public.save, type: 'button', callback: function (ldata) {
                                var loadT = bt.load();
                                ldata['version'] = version;
                                bt.send('SetPHPConf', 'config/SetPHPConf', ldata, function (rdata) {
                                    loadT.close();
                                    soft.get_tab_contents(key, obj);
                                    bt.msg(rdata)
                                });
                            }
                        }]
                    }
                    var _form_data = bt.render_form_line(datas);
                    $('.conf_p').append(_form_data.html)
                    bt.render_clicks(_form_data.clicks);
                });
                break;
            case 'set_upload_limit':
                bt.soft.php.get_limit_config(version, function (ret) {
                    var datas = [
                        {
                            items: [
                                { title: '', type: 'number', width: '100px', value: ret.max, unit: 'MB', name: 'phpUploadLimit' },
                                {
                                    name: 'btn_limit_get', text: lan.public.save, type: 'button', callback: function (ldata) {
                                        var max = ldata.phpUploadLimit;
                                        if (max < 2) {
                                            layer.msg(lan.soft.php_upload_size, { icon: 2 });
                                            return;
                                        }
                                        bt.soft.php.set_upload_max(version, max, function (rdata) {
                                            if (rdata.status) {
                                                soft.get_tab_contents(key, obj);
                                            }
                                            bt.msg(rdata);
                                        })
                                    }
                                }
                            ]
                        }
                    ]
                    var clicks = [];
                    var tabCon = $(".soft-man-con").empty().append("<div class='set_upload_limit'></div>")
                    for (var i = 0; i < datas.length; i++) {
                        var _form_data = bt.render_form_line(datas[i]);
                        $('.set_upload_limit').append(_form_data.html);
                        clicks = clicks.concat(_form_data.clicks);
                    }
                    bt.render_clicks(clicks);
                })
                break;
            case 'set_timeout_limit':
                bt.soft.php.get_limit_config(version, function (ret) {
                    var datas = [
                        {
                            items: [
                                { title: '', type: 'number', width: '100px', value: ret.maxTime, name: 'phpTimeLimit', unit: '秒' },
                                {
                                    name: 'btn_limit_get', text: lan.public.save, type: 'button', callback: function (ldata) {
                                        var max = ldata.phpTimeLimit;
                                        bt.soft.php.set_php_timeout(version, max, function (rdata) {
                                            if (rdata.status) {
                                                soft.get_tab_contents(key, obj);
                                            }
                                            bt.msg(rdata);
                                        })
                                    }
                                }]
                        }
                    ]
                    var clicks = [];
                    var tabCon = $(".soft-man-con").empty().append("<div class='set_timeout_limit bt-form'></div>")
                    for (var i = 0; i < datas.length; i++) {
                        var _form_data = bt.render_form_line(datas[i]);
                        $('.set_timeout_limit').append(_form_data.html);
                        clicks = clicks.concat(_form_data.clicks);
                    }
                    bt.render_clicks(clicks);
                })
                break;
            case 'set_dis_fun':
                bt.soft.php.get_config(version, function (rdata) {
                    var list = [];
                    var disable_functions = rdata.disable_functions.split(',');
                    for (var i = 0; i < disable_functions.length; i++) {
                        if (disable_functions[i] == '') continue;
                        list.push({ name: disable_functions[i] })
                    }
                    var _bt_form = $("<div class='bt-form' style='height:400px;'></div>")
                    var tabCon = $(".soft-man-con").empty().append(_bt_form);
                    var _line = bt.render_form_line({
                        title: '', items: [
                            { name: 'disable_function_val', placeholder: lan.soft.fun_ps1, width: '410px' },
                            {
                                name: 'btn_disable_function_val', text: lan.public.save, type: 'button', callback: function (ldata) {
                                    var disable_functions = rdata.disable_functions.split(',')
                                    if ($.inArray(ldata.disable_function_val, disable_functions) >= 0) {
                                        bt.msg({ msg: lan.soft.fun_msg, icon: 5 });
                                        return;
                                    }
                                    disable_functions.push(ldata.disable_function_val);
                                    set_disable_functions(version, disable_functions.join(','))
                                }
                            }
                        ]
                    }, '', _bt_form)

                    bt.render_clicks(_line.clicks);
                    _bt_form.append("<div class='divtable mtb15' style='height:350px;overflow:auto'><table id=\"blacktable\" class='table table-hover' width='100%' style='margin-bottom:0'></table><div>")
                    var _tab = bt.render({
                        table: '#blacktable',
                        data: list,
                        columns: [
                            { field: 'name', title: lan.soft.php_ext_name },
                            {
                                field: 'opt', title: lan.public.action, width: 50, templet: function (item) {
                                    var new_disable_functions = disable_functions.slice()
                                    new_disable_functions.splice($.inArray(item.name, new_disable_functions), 1)
                                    console.log(new_disable_functions)
                                    return '<a class="del_functions" style="float:right;" data-val="shell_exec" onclick="set_disable_functions(\'' + version + '\',\'' + new_disable_functions.join(',') + '\')" href="javascript:;">删除</a>';
                                }
                            }
                        ]
                    })
                    tabCon.append(bt.render_help([lan.soft.fun_ps2, lan.soft.fun_ps3]));

                    
                })
                break;
            case 'set_fpm_config':
                bt.soft.php.get_fpm_config(version, function (rdata) {
                    var datas = {
                        '30': {
                            max_children: 30,
                            start_servers: 5,
                            min_spare_servers: 5,
                            max_spare_servers: 20
                        },
                        '50': {
                            max_children: 50,
                            start_servers: 15,
                            min_spare_servers: 15,
                            max_spare_servers: 35
                        },
                        '100': {
                            max_children: 100,
                            start_servers: 20,
                            min_spare_servers: 20,
                            max_spare_servers: 70
                        },
                        '200': {
                            max_children: 200,
                            start_servers: 25,
                            min_spare_servers: 25,
                            max_spare_servers: 150
                        },
                        '300': {
                            max_children: 300,
                            start_servers: 30,
                            min_spare_servers: 30,
                            max_spare_servers: 180
                        },
                        '500': {
                            max_children: 500,
                            start_servers: 35,
                            min_spare_servers: 35,
                            max_spare_servers: 250
                        }
                    }
                    var limits = [], pmList = [];
                    for (var k in datas) limits.push({ title: k + lan.soft.concurrency, value: k });
                    var _form_datas = [
                        {
                            title: lan.soft.concurrency_type, name: 'limit', value: rdata.max_children, type: 'select', items: limits, callback: function (iKey) {
                                var item = datas[iKey.val()]
                                for (var sk in item) $('.' + sk).val(item[sk]);
                            }
                        },
                        {
                            title: lan.soft.php_fpm_model, name: 'pm', value: rdata.pm, type: 'select', items: [
                                { title: lan.bt.static, value: 'static' },
                                { title: lan.bt.dynamic, value: 'dynamic' }
                            ], ps: '*' + lan.soft.php_fpm_ps1
                        },
                        { title: 'max_children', name: 'max_children', value: rdata.max_children, type: 'number', width: '100px', ps: '*' + lan.soft.php_fpm_ps2 },
                        { title: 'start_servers', name: 'start_servers', value: rdata.start_servers, type: 'number', width: '100px', ps: '*' + lan.soft.php_fpm_ps3 },
                        { title: 'min_spare_servers', name: 'min_spare_servers', value: rdata.min_spare_servers, type: 'number', width: '100px', ps: '*' + lan.soft.php_fpm_ps4 },
                        { title: 'max_spare_servers', name: 'max_spare_servers', value: rdata.max_spare_servers, type: 'number', width: '100px', ps: '*' + lan.soft.php_fpm_ps5 },
                        {
                            title: ' ', text: lan.public.save, name: 'btn_children_submit', css: 'btn-success', type: 'button', callback: function (ldata) {
                                console.log(ldata)
                                bt.pub.get_menm(function (memInfo) {
                                    var limit_children = parseInt(memInfo['memTotal'] / 8);
                                    if (limit_children < parseInt(ldata.max_children)) {
                                        layer.msg('当前服务器内存不足，最大允许[' + limit_children + ']个子进程!', { icon: 2 });
                                        $("input[name='max_children']").focus();
                                        return;
                                    }
                                    if (parseInt(ldata.max_children) < parseInt(ldata.max_spare_servers)) {
                                        layer.msg(lan.soft.php_fpm_err1, { icon: 2 });
                                        return;
                                    }
                                    if (parseInt(ldata.min_spare_servers) > parseInt(ldata.start_servers)) {
                                        layer.msg(lan.soft.php_fpm_err2, { icon: 2 });
                                        return;
                                    }
                                    if (parseInt(ldata.max_spare_servers) < parseInt(ldata.min_spare_servers)) {
                                        layer.msg(lan.soft.php_fpm_err3, { icon: 2 });
                                        return;
                                    }
                                    if (parseInt(ldata.max_children) < parseInt(ldata.start_servers)) {
                                        layer.msg(lan.soft.php_fpm_err4, { icon: 2 });
                                        return;
                                    }
                                    if (parseInt(ldata.max_children) < 1 || parseInt(ldata.start_servers) < 1 || parseInt(ldata.min_spare_servers) < 1 || parseInt(ldata.max_spare_servers) < 1) {
                                        layer.msg(lan.soft.php_fpm_err5, { icon: 2 });
                                        return;
                                    }
                                    ldata['version'] = version;
                                    bt.soft.php.set_fpm_config(version, ldata, function (rdata) {
                                        soft.get_tab_contents(key, obj);
                                        bt.msg(rdata);
                                    })
                                })
                            }
                        }
                    ]
                    var tabCon = $(".soft-man-con").empty()
                    var _c_form = $('<div class="bt-form php-limit-config"></div >')
                    var clicks = [];
                    for (var i = 0; i < _form_datas.length; i++) {
                        var _form = bt.render_form_line(_form_datas[i]);
                        _c_form.append(_form.html)
                        clicks = clicks.concat(_form.clicks);
                    }
                    tabCon.append(_c_form);
                    bt.render_clicks(clicks);
                });
                break;
            case 'get_php_status':
                bt.soft.php.get_php_status(version, function (rdata) {
                    var arr = {};
                    arr[lan.bt.php_pool] = rdata.pool;
                    arr[lan.bt.php_manager] = ((rdata['process manager'] == 'dynamic') ? lan.bt.dynamic : lan.bt.static);
                    arr[lan.bt.php_start] = rdata['start time'];
                    arr[lan.bt.php_accepted] = rdata['accepted conn'];
                    arr[lan.bt.php_queue] = rdata['listen queue'];
                    arr[lan.bt.php_max_queue] = rdata['max listen queue'];
                    arr[lan.bt.php_len_queue] = rdata['listen queue len'];
                    arr[lan.bt.php_idle] = rdata['idle processes'];
                    arr[lan.bt.php_active] = rdata['active processes'];
                    arr[lan.bt.php_total] = rdata['total processes'];
                    arr[lan.bt.php_max_active] = rdata['max active processes'];
                    arr[lan.bt.php_max_children] = rdata['max children reached'];
                    arr[lan.bt.php_slow] = rdata['slow requests'];

                    var con = "<div style='height:450px;overflow:auto;'><table id='tab_php_status' class='table table-hover table-bordered' style='margin:0;padding:0'></table></div>";
                    $(".soft-man-con").html(con);
                    bt.render_table('tab_php_status', arr);
                })
                break;
              case 'get_php_session':
				bt.soft.php.get_php_session(version,function(res){
                    $(".soft-man-con").html('<div class="conf_p">'+
                        '<div class="line ">'+
                            '<span class="tname">存储模式</span>'+
                            '<div class="info-r ">'+
                                '<select class="bt-input-text mr5 change_select_session" name="save_handler" style="width:160px">'+
                                    '<option value="files" '+ (res.save_handler == 'files'?'selected':'') +'>files</option>'+
                                    (version != '52'?'<option value="redis" '+ (res.save_handler == 'redis'?'selected':'') +'>redis</option>':'') +
                                    (version != '73'?'<option value="memcache" '+ (res.save_handler == 'memcache'?'selected':'') +'>memcache</option>':'')+
                                '</select>'+
                            '</div>'+
                        '</div>'+
                        '<div class="line">'+
                            '<span class="tname">IP地址</span>'+
                            '<div class="info-r ">'+
                                '<input name="ip" class="bt-input-text mr5" type="text" style="width:160px" value="'+ res.save_path +'">'+
                            '</div>'+
                        '</div>'+
                        '<div class="line">'+
                            '<span class="tname">端口</span>'+
                            '<div class="info-r ">'+
                                '<input name="port" class="bt-input-text mr5" type="text" style="width:160px" value="'+ res.port +'">'+
                            '</div>'+
                        '</div>'+
                       '<div class="line">'+
                            '<span class="tname">密码</span>'+
                            '<div class="info-r ">'+
                                '<input name="passwd" class="bt-input-text mr5" placeholder="如果没有密码留空" type="text" style="width:160px" value="'+ res.passwd +'">'+
                            '</div>'+
                        '</div>'+
                        '<div class="line">'+
                            '<button name="btn_save" class="btn btn-success btn-sm mr5 ml5 btn_conf_save" style="margin-left: 110px;">保存</button>'+
                        '</div>'+
                        '<ul class="help-info-text c7">'+
                            '<li>若你的站点并发比较高，使用Redis，Memcache能有效提升PHP并发能力</li>'+
                            '<li>若调整Session模式后，网站访问异常，请切换回原来的模式</li>'+
                            '<li>切换Session模式会使在线的用户会话丢失，请在流量小的时候切换</li>'+
                        '</ul>'+
                        '<div class="session_clear" style="border-top: #ccc 1px dashed;padding-top: 15px;margin-top: 15px;">'+
                        '<div class="clear_title" style="padding-bottom:15px;">清理Session文件</div><div class="clear_conter"></div></div>'+
                    '</div>');
                    if(res.save_handler == 'files'){
                        bt.soft.php.get_session_count(function(res){
                            console.log(res);
                            $('.clear_conter').html('<div class="session_clear_list"><div class="line"><span>总Session文件数量</span><span>'+ res.total +'</span></div><div class="line"><span>可清理的Session文件数量</span><span>'+ res.oldfile +'</span></div></div><button class="btn btn-success btn-sm clear_session_file">清理session文件</button>')
                            $('.clear_session_file').click(function(){
                                bt.soft.php.clear_session_count({
                                    title:'清理php_session文件',
                                    msg:'是否清理php_session文件？'
                                },function(res) {
                                    layer.msg(res.msg,{icon:res.status?1:2});
                                    setTimeout(function(){
                                        $('.bt-soft-menu p:eq(9)').click();
                                    },2000);
                                });
                            })
                        });
                    }else{
                        $('.clear_conter').html('当前只有存储模式为files才需要清理。').attr('style','color:#666')
                    }
                    switch_type(res.save_handler);
                    $('.change_select_session').change(function(){
                        switch_type($(this).val());
                        switch($(this).val()){
                            case 'redis':
                                $('[name="ip"]').val('127.0.0.1');
                                $('[name="port"]').val('6379');
                            break;
                            case 'memcache':
                                $('[name="ip"]').val('127.0.0.1');
                                $('[name="port"]').val('11211');
                            break;
                        }
                    });
                    $('.btn_conf_save').click(function(){
                        bt.soft.php.set_php_session({
                            version:version,
                            save_handler:$('[name="save_handler"]').val(),
                            ip:$('[name="ip"]').val(),
                            port:$('[name="port"]').val(),
                            passwd:$('[name="passwd"]').val()
                        },function(res){
                            layer.msg(res.msg,{icon:res.status?1:2});
                            setTimeout(function(){
                              $('.bt-soft-menu p:eq(9)').click();
                            },2000);
                        })
                    });
                    function switch_type(type){
                        switch(type){
                            case 'files':
                                $('[name="ip"]').attr('disabled','disabled').val('');
                                $('[name="port"]').attr('disabled','disabled').val('');
                                $('[name="passwd"]').attr('disabled','disabled').val('');
                            break;
                            case 'redis':
                                $('[name="ip"]').attr('disabled',false);
                                $('[name="port"]').attr('disabled',false);
                                $('[name="passwd"]').attr('disabled',false);
                            break;
                            case 'memcache':
                                $('[name="ip"]').attr('disabled',false);
                                $('[name="port"]').attr('disabled',false);
                                $('[name="passwd"]').attr('disabled','disabled').val('');
                            break;
                        }
                    }
                });
			break
            case 'get_fpm_logs':
                bt.soft.php.get_fpm_logs(version, function (logs) {
                    var phpCon = '<textarea readonly="" style="margin: 0px;width: 500px;height: 520px;background-color: #333;color:#fff; padding:0 5px" id="error_log">' + logs.msg + '</textarea>';
                    $(".soft-man-con").html(phpCon);
                    var ob = document.getElementById('error_log');
                    ob.scrollTop = ob.scrollHeight;
                })
                break;
            case 'get_slow_logs':
                bt.soft.php.get_slow_logs(version, function (logs) {
                    var phpCon = '<textarea readonly="" style="margin: 0px;width: 500px;height: 520px;background-color: #333;color:#fff; padding:0 5px" id="error_log">' + logs.msg + '</textarea>';
                    $(".soft-man-con").html(phpCon);
                    var ob = document.getElementById('error_log');
                    ob.scrollTop = ob.scrollHeight;
                })
                break;
            case 'get_redis_status':
                bt.soft.redis.get_redis_status(function (rdata) {
                    var hit = (parseInt(rdata.keyspace_hits) / (parseInt(rdata.keyspace_hits) + parseInt(rdata.keyspace_misses)) * 100).toFixed(2);
                    var arrs = [];
                    arrs['uptime_in_days'] = [rdata.uptime_in_days, '已运行天数'];
                    arrs['tcp_port'] = [rdata.tcp_port, '当前监听端口'];
                    arrs['connected_clients'] = [rdata.connected_clients, '连接的客户端数量'];
                    arrs['used_memory_rss'] = [bt.format_size(rdata.used_memory_rss), 'Redis当前占用的系统内存总量'];
                    arrs['used_memory'] = [bt.format_size(rdata.used_memory), 'Redis历史分配内存的峰值'];
                    arrs['mem_fragmentation_ratio'] = [rdata.mem_fragmentation_ratio, '内存碎片比率'];
                    arrs['total_connections_received'] = [rdata.total_connections_received, '运行以来连接过的客户端的总数量'];
                    arrs['total_commands_processed'] = [rdata.total_commands_processed, '运行以来执行过的命令的总数量'];
                    arrs['instantaneous_ops_per_sec'] = [rdata.instantaneous_ops_per_sec, '服务器每秒钟执行的命令数量'];
                    arrs['keyspace_hits'] = [rdata.keyspace_hits, '查找数据库键成功的次数'];
                    arrs['keyspace_misses'] = [rdata.keyspace_misses, '查找数据库键失败的次数'];
                    arrs['hit'] = [hit, '查找数据库键命中率'];
                    arrs['latest_fork_usec'] = [rdata.latest_fork_usec, '最近一次 fork() 操作耗费的微秒数'];

                    var con = "<div class=\"divtable\"><table id='tab_get_redis_status' style=\"width: 490px;\" class='table table-hover table-bordered '><thead><th>字段</th><th>当前值</th><th>说明</th></thead></table></div>";
                    $(".soft-man-con").html(con);
                    bt.render_table('tab_get_redis_status', arrs, true);
                })
                break;
        }
    },
    update_zip_open: function (){
        $("#update_zip").on("change", function () {
            var files = $("#update_zip")[0].files;
            if (files.length == 0) {
                return;
            }
            soft.update_zip(files[0]);
            $("#update_zip").val('')
        });

        $("#update_zip").click();
    },
    update_zip: function (file) {
        var formData = new FormData();
        formData.append("plugin_zip", file);
        $.ajax({
            url: "/plugin?action=update_zip",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                if (data.status === false) {
                    layer.msg(data.msg, { icon: 2 });
                    return;
                }
                var loadT = layer.open({
                    type: 1,
                    area: "500px",
                    title: "安装第三方插件包",
                    closeBtn: 2,
                    shift: 5,
                    shadeClose: false,
                    content: '<style>\
                        .install_three_plugin{padding:25px;padding-bottom:70px}\
                        .plugin_user_info p { font-size: 14px;}\
                        .plugin_user_info {padding: 15px 30px;line-height: 26px;background: #f5f6fa;border-radius: 5px;border: 1px solid #efefef;}\
                        .btn-content{text-align: center;margin-top: 25px;}\
                    </style>\
                    <div class="bt-form c7  install_three_plugin pb70">\
                        <div class="plugin_user_info">\
                            <p><b>名称：</b>'+ data.title + '</p>\
                            <p><b>版本：</b>' + data.versions +'</p>\
                            <p><b>描述：</b>' + data.ps + '</p>\
                            <p><b>大小：</b>' + bt.format_size(data.size, true) + '</p>\
                            <p><b>作者：</b>' + data.author + '</p>\
                            <p><b>来源：</b><a class="btlink" href="'+data.home+'" target="_blank">' + data.home + '</a></p>\
                        </div>\
                        <ul class="help-info-text c7">\
                            <li style="color:red;">此为第三方开发的插件，宝塔无法验证其可靠性!</li>\
                            <li>安装过程可能需要几分钟时间，请耐心等候!</li>\
                            <li>如果已存在此插件，将被替换!</li>\
                        </ul>\
                        <div class="bt-form-submit-btn"><button type="button" class="btn btn-sm btn-danger mr5" onclick="layer.closeAll()">取消</button><button type="button" class="btn btn-sm btn-success" onclick="soft.input_zip(\''+ data.name + '\',\'' + data.tmp_path +'\')">确定安装</button></div>\
                    </div>'
                });
            },
            error: function (responseStr) {
                layer.msg('上传失败2!', { icon: 2 });
            }
        });
    },

    input_zip: function (plugin_name, tmp_path) {
        layer.msg('正在安装,这可能需要几分钟时间...', { icon: 16, time: 0, shade: [0.3, '#000'] });
        $.post('/plugin?action=input_zip', { plugin_name: plugin_name, tmp_path: tmp_path }, function (rdata) {
            layer.closeAll()
            if (rdata.status) {
                soft.get_list();
            }
            setTimeout(function () { layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 }) }, 1000);
        });
    }


};
soft.get_list();

$(document).ready(function () {
    soft.get_list();
    setTimeout(function () {
        soft_td_width_auto();
    }, 500);
});
$(window).resize(function () {
    soft_td_width_auto();
});
function soft_td_width_auto() {
    var thead_width = '', winWidth = $(window).width();
    if (winWidth <= 1370 && winWidth > 1280) {
        thead_width = winWidth / 4;
    } else if (winWidth <= 1280 && winWidth > 1210) {
        thead_width = winWidth / 5;
    } else if (winWidth <= 1210) {
        thead_width = winWidth / 6;
    } else {
        thead_width = winWidth / 3.5;
    }
    $('#softList thead th:eq(2)').width(thead_width);
    $('#softList tbody tr td:nth-child(8n+2)>span').width(thead_width + 75);
}

function set_disable_functions(version, data) {
    bt.soft.php.disable_functions(version, data, function (rdata) {
        if (rdata.status) {
            soft.get_tab_contents('set_dis_fun', $(".bgw"));
        }
        bt.msg(rdata);
    })
}