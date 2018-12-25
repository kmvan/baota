bt.pub.check_install(function (rdata) {
    if (rdata === false) bt.index.rec_install();
})
var interval_stop = false;
var index = {
    interval: {
        limit: 10,
        count: 0,
        task_id: 0,
        start: function () {
            var _this = this;
            _this.count = 0;
            _this.task_id = setInterval(function () {
                if (_this.count >= _this.limit) {
                    _this.reload();
                    return;
                }
                _this.count++;
                if (!interval_stop) index.get_data_info();
            }, 3000)
        },
        reload: function () {
            var _this = this;
            if (_this) clearInterval(_this.task_id);
            _this.start();
        }
    },
    net: {
        table: null,
        data: {
            uData: [],
            dData: [],
            aData: []
        },
        init: function () {
            //流量图表
            index.net.table = echarts.init(document.getElementById('NetImg'));
            var obj = {};
            obj.dataZoom = [];
            obj.unit = lan.index.unit + ':KB/s';
            obj.tData = index.net.data.aData;

            obj.list = [];
            obj.list.push({ name: lan.index.net_up, data: index.net.data.uData, circle: 'circle', itemStyle: { normal: { color: '#f7b851' } }, areaStyle: { normal: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(255, 140, 0,0.5)' }, { offset: 1, color: 'rgba(255, 140, 0,0.8)' }], false) } }, lineStyle: { normal: { width: 1, color: '#aaa' } } });
            obj.list.push({ name: lan.index.net_down, data: index.net.data.dData, circle: 'circle', itemStyle: { normal: { color: '#52a9ff' } }, areaStyle: { normal: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(30, 144, 255,0.5)' }, { offset: 1, color: 'rgba(30, 144, 255,0.8)' }], false) } }, lineStyle: { normal: { width: 1, color: '#aaa' } } });
            option = bt.control.format_option(obj)

            index.net.table.setOption(option);
            window.addEventListener("resize", function () {
                index.net.table.resize();
            });
        },
        add: function (up, down) {
            var _net = this;
            var limit = 8;
            var d = new Date()

            if (_net.data.uData.length >= limit) _net.data.uData.splice(0, 1);
            if (_net.data.dData.length >= limit) _net.data.dData.splice(0, 1);
            if (_net.data.aData.length >= limit) _net.data.aData.splice(0, 1);

            _net.data.uData.push(up);
            _net.data.dData.push(down);
            _net.data.aData.push(d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
        }
    },
    mem: {
        status: 1,
        set_status: function (obj, status, val) {
            var _this = this;
            _this.status = status;
            var _div = $('<div><span style="display:none">1</span></div>')
            if (status == 2) {
                obj.find(".mem-re-con").animate({ "top": "-400px", opacity: 0 }); //动画
                var btlen = parseInt(obj.find('.occupy span').html());
                for (var i = 0; i < btlen; i++) {
                    setTimeout(index.set_val(obj.parents('li'), { usage: btlen - i }), i * 30);
                };
                obj.addClass("mem-action");
                obj.find('.occupy').html(_div.append(lan.index.memre_ok_0 + ' <img src="/static/img/ings.gif">').html());
            }
            else if (status == 1) { //完成
                obj.removeClass('mem-action');
                obj.find('.occupy').removeClass('line').html("<span>" + val + "</span>%");
            }
            else {
                obj.find('.occupy').html(_div.append(status).html());
                if (bt.contains(status, '<br>')) obj.find('.occupy').addClass('line')
            }
        }
    },
    get_init: function () {
        var _this = this;
        setTimeout(function () { _this.get_disk_list(); }, 500)
        setTimeout(function () { _this.get_server_info(); }, 1000)


        bt.pub.get_user_info(function (rdata) {
            if (rdata.status) {
                $(".bind-user").html(rdata.data.username);
                bt.weixin.get_user_info(function (rdata) {
                    if (!rdata.status) {
                        bt.msg(rdata);
                        return;
                    }
                    if (JSON.stringify(rdata.msg) != '{}') {
                        var datas = rdata.msg;
                        for (var key in datas) {
                            var item = datas[key];
                            item.nickName
                            $(".bind-weixin a").text(item.nickName);
                            break;
                        }
                    }
                })
            }
            else {
                $(".bind-weixin a").attr("href", "javascript:;");
                $(".bind-weixin a").click(function () {
                    bt.msg({ msg: '请先绑定宝塔账号!', icon: 2 });
                })
            }
        })

        _this.get_data_info(function (loadbox, rdata) {
            loadbox.hover(function () {
                var _this = $(this);
                var d = _this.parents('ul').data('data').load;
                layer.tips('最近1分钟平均负载：' + d.one + '</br>最近5分钟平均负载：' + d.five + '</br>最近15分钟平均负载：' + d.fifteen + '', _this.find('.cicle'), { time: 0, tips: [1, '#999'] });
            }, function () {
                layer.closeAll('tips');
            })

            $(".mem-release").hover(function () {
                $(this).addClass("shine_green");
                if (!($(this).hasClass("mem-action"))) {
                    $(this).find(".mem-re-min").hide();
                    $(this).find(".occupy").css({ "color": "#d2edd8" });
                    $(this).find(".mem-re-con").css({ "display": "block" });
                    $(this).find(".mem-re-con").animate({ "top": "0", opacity: 1 });
                }
            }, function () {
                if (!($(this).hasClass("mem-action"))) {
                    $(this).find(".mem-re-min").show();
                }
                else {
                    $(this).find(".mem-re-min").hide();
                }
                $(this).removeClass("shine_green");
                $(this).find(".occupy").css({ "color": "#20a53a" });
                $(this).find(".mem-re-con").css({ "top": "15px", opacity: 1, "display": "none" });
                $(this).next().html(bt.get_cookie("mem-before"));
            }).click(function () {
                var _this = $(this);
                if (!(_this.hasClass("mem-action"))) {
                    var data = _this.parents('ul').data('data').mem;
                    index.mem.set_status(_this, 2); //释放中
                    bt.system.re_memory(function (nData) {
                        index.mem.set_status(_this, '释放完成');
                        setTimeout(function () {
                            var t = nData.memFree - data.memFree;
                            var m = lan.index.memre_ok_2;
                            if (t > 0) m = lan.index.memre_ok_1 + "<br>" + t + "MB";
                            index.mem.set_status(_this, m);
                        }, 200);
                        setTimeout(function () { index.mem.set_status(_this, 1, (nData.memRealUsed * 100 / nData.memTotal).toFixed(1)); }, 1200);
                    })
                }
            })
        });
        setTimeout(function () { _this.interval.start(); }, 1600)
        setTimeout(function () { index.get_index_list(); }, 1200)


        setTimeout(function () {
            _this.net.init();
        }, 200);

        setTimeout(function () {
            bt.system.check_update(function (rdata) {
                //console.log(rdata);
                if (rdata.status !== false) {
                    $('#toUpdate a').html('更新<i style="display: inline-block; color: red; font-size: 40px;position: absolute;top: -35px; font-style: normal; right: -8px;">.</i>');
                    $('#toUpdate a').css("position", "relative");
                }
            }, false)
        }, 1500)
    },
    get_data_info: function (callback) {

        bt.system.get_net(function (net) {

            var pub_arr = [{ val: 100, color: '#dd2f00' }, { val: 90, color: '#ff9900' }, { val: 70, color: '#20a53a' }, { val: 30, color: '#20a53a' }];
            var load_arr = [{ title: '运行堵塞', val: 100, color: '#dd2f00' }, { title: '运行缓慢', val: 90, color: '#ff9900' }, { title: '运行正常', val: 70, color: '#20a53a' }, { title: '运行流畅', val: 30, color: '#20a53a' }];
            var _cpubox = $('.cpubox'), _membox = $('.membox'), _loadbox = $('.loadbox')

            index.set_val(_cpubox, { usage: net.cpu[0], title: net.cpu[1] + ' ' + lan.index.cpu_core, items: pub_arr })
            index.set_val(_membox, { usage: (net.mem.memRealUsed * 100 / net.mem.memTotal).toFixed(1), items: pub_arr, title: net.mem.memRealUsed + '/' + net.mem.memTotal + '(MB)' })
            bt.set_cookie('memSize', net.mem.memTotal)

            var _lval = Math.round((net.load.one / net.load.max) * 100);
            if (_lval > 100) _lval = 100;
            index.set_val(_loadbox, { usage: _lval, items: load_arr })
            _loadbox.parents('ul').data('data', net);

            //刷新流量
            $("#upSpeed").html(net.up + ' KB');
            $("#downSpeed").html(net.down + ' KB');
            $("#downAll").html(bt.format_size(net.downTotal));
            $("#upAll").html(bt.format_size(net.upTotal));
            index.net.add(net.up, net.down);
            if (index.net.table) index.net.table.setOption({ xAxis: { data: index.net.data.aData }, series: [{ name: lan.index.net_up, data: index.net.data.uData }, { name: lan.index.net_down, data: index.net.data.dData }] });

            if (callback) callback(_loadbox, net);
        })
    },
    get_server_info: function () {
        bt.system.get_total(function (info) {
            var memFree = info.memTotal - info.memRealUsed;
            if (memFree < 64) {
                $("#messageError").show();
                $("#messageError").append('<p><span class="glyphicon glyphicon-alert" style="color: #ff4040; margin-right: 10px;">' + lan.index.mem_warning + '</span> </p>')
            }

            if (info.isuser > 0) {
                $("#messageError").show();
                $("#messageError").append('<p><span class="glyphicon glyphicon-alert" style="color: #ff4040; margin-right: 10px;"></span>' + lan.index.user_warning + '<span class="c7 mr5" title="此安全问题不可忽略，请尽快处理" style="cursor:no-drop"> [不可忽略]</span><a class="btlink" href="javascript:setUserName();"> [立即修改]</a></p>')
            }
            var _system = info.system;
            $("#info").html(_system);
            $("#running").html(info.time);
            if (_system.indexOf("Windows") != -1) {
                $(".ico-system").addClass("ico-windows");
            }
            else if (_system.indexOf("CentOS") != -1) {
                $(".ico-system").addClass("ico-centos");
            }
            else if (_system.indexOf("Ubuntu") != -1) {
                $(".ico-system").addClass("ico-ubuntu");
            }
            else if (_system.indexOf("Debian") != -1) {
                $(".ico-system").addClass("ico-debian");
            }
            else if (_system.indexOf("Fedora") != -1) {
                $(".ico-system").addClass("ico-fedora");
            }
            else {
                $(".ico-system").addClass("ico-linux");
            }
        })
    },
    get_disk_list: function () {
        bt.system.get_disk_list(function (rdata) {
            if (rdata) {
                var data = { table: '#systemInfoList', items: [] };
                for (var i = 0; i < rdata.length; i++) {
                    var item = rdata[i];
                    var obj = {};
                    obj.name = item.path;
                    obj.title = item.size[1] + '/' + item.size[0];
                    obj.rate = item.size[3].replace('%', '');
                    obj.free = item.size[2];
                    var arr = [];
                    arr.push({ title: 'Inode信息', value: '' })
                    arr.push({ title: '总数', value: item.inodes[0] })
                    arr.push({ title: '已使用', value: item.inodes[1] })
                    arr.push({ title: '可用', value: item.inodes[2] })
                    arr.push({ title: 'Inode使用率', value: item.inodes[3] })
                    obj.masks = arr;
                    data.items.push(obj)
                }
                index.render_disk(data);
            }
        })
    },
    render_disk: function (data) {
        if (data.items.length > 0) {
            var _tab = $(data.table);
            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];
                var html = '';
                html += '<li class="col-xs-6 col-sm-3 col-md-3 col-lg-2 mtb20 circle-box text-center diskbox">';
                html += '<h3 class="c9 f15">' + item.name + '</h3>';
                html += '<div class="cicle">';
                html += '<div class="bar bar-left"><div class="bar-left-an bar-an"></div></div>';
                html += '<div class="bar bar-right"><div  class="bar-right-an bar-an"></div></div>';
                html += '<div class="occupy"><span>0</span>%</div>';
                html += '</div>';
                html += '<h4 class="c9 f15">' + item.title + '</h4>';
                html += '</li>';
                var _li = $(html);

                if (item.masks) {
                    var mask = '';
                    for (var j = 0; j < item.masks.length; j++) mask += item.masks[j].title + ': ' + item.masks[j].value + "<br>";
                    _li.data('mask', mask);
                    _li.hover(function () {
                        var _this = $(this);
                        layer.tips(_this.data('mask'), _this.find('.cicle'), { time: 0, tips: [1, '#999'] });
                    }, function () {
                        layer.closeAll('tips');
                    })
                }
                var color = '#20a53a';
                if (parseFloat(item.rate) >= 80) color = '#ff9900';
                var size = parseFloat(item.free.substr(0, item.free.length - 1));
                var unit = item.free.substr(item.free.length - 1, 1);
                switch (unit) {
                    case 'G':
                        if (size < 1) color = '#dd2f00';
                        break;
                    case 'T':
                        if (size < 0.1) color = '#dd2f00';
                        break;
                    default:
                        color = '#dd2f00'
                        break;
                }
                index.set_val(_li, { usage: item.rate, color: color })
                _tab.append(_li);
            }
        }
    },
    set_val: function (_li, obj) {
        //obj.usage = parseInt(obj.usage)
        if (obj.usage > 50) {
            setTimeout(function () { _li.find('.bar-right-an').css({ "transform": "rotate(45deg)", "transition": "transform 750ms linear" }); }, 10)
            setTimeout(function () { _li.find('.bar-left-an').css({ "transform": "rotate(" + (((obj.usage - 50) / 100 * 360) - 135) + "deg)", "transition": "transform 750ms linear" }); }, 760);
        } else {
            if (parseInt(_li.find('.occupy span').html()) > 50) {
                setTimeout(function () { _li.find('.bar-right-an').css({ "transform": "rotate(" + ((obj.usage / 100 * 360) - 135) + "deg)", "transition": "transform 750ms linear" }) }, 760);
                setTimeout(function () { _li.find('.bar-left-an').css({ "transform": "rotate(-135deg)", "transition": "transform 750ms linear" }) }, 10)
            } else {
                setTimeout(function () { _li.find('.bar-right-an').css({ "transform": "rotate(" + ((obj.usage / 100 * 360) - 135) + "deg)", "transition": "transform 750ms linear" }); }, 10)
            }
        }
        if (obj.items) {
            var item = {};
            for (var i = 0; i < obj.items.length; i++) {
                if (obj.usage <= obj.items[i].val) {
                    item = obj.items[i];
                    continue;
                }
                break;
            }
            if (item.title) obj.title = item.title;
            if (item.color) obj.color = item.color;
        }
        if (obj.color) {
            _li.find('.cicle .bar-left-an').css('border-color', 'transparent transparent ' + obj.color + ' ' + obj.color);
            _li.find('.cicle .bar-right-an').css('border-color', obj.color + ' ' + obj.color + ' transparent transparent');
            _li.find('.occupy').css('color', obj.color);
        }
        if (obj.title) _li.find('h4').text(obj.title);
        _li.find('.occupy span').html(obj.usage);
    },
    get_index_list: function () {
        bt.soft.get_index_list(function (rdata) {
            var con = '';
            var icon = '';
            var rlen = rdata.length;
            var clickName = '';
            var setup_length = 0;
            for (var i = 0; i < rlen; i++) {
                if (rdata[i].setup) {
                    setup_length++;
                    if (rdata[i].admin) {
                        clickName = ' onclick="bt.soft.set_lib_config(\'' + rdata[i].name + '\',\'' + rdata[i].title + '\')"';
                    }
                    else {
                        clickName = 'onclick="soft.set_soft_config(\'' + rdata[i].name + '\')"';
                    }
                    var icon = rdata[i].name;
                    if (bt.contains(rdata[i].name, 'php')) {
                        icon = 'php';
                        rdata[i].version = '';
                    }
                    var status = '';
                    if (rdata[i].status) {
                        status = '<span style="color:#20a53a" class="glyphicon glyphicon-play"></span>';
                    } else {
                        status = '<span style="color:red" class="glyphicon glyphicon-pause"></span>'
                    }
                    con += '<div class="col-sm-3 col-md-3 col-lg-3" data-id="' + rdata[i].name + '">\
							<span class="spanmove"></span>\
							<div '+ clickName + '>\
							<div class="image"><img src="/static/img/soft_ico/ico-'+ icon + '.png"></div>\
							<div class="sname">'+ rdata[i].title + ' ' + rdata[i].version + status + '</div>\
							</div>\
						</div>'
                }
            }
            $("#indexsoft").html(con);
            //软件位置移动
            var softboxsum = 12;
            var softboxcon = '';
            if (setup_length <= softboxsum) {
                for (var i = 0; i < softboxsum - setup_length; i++) {
                    softboxcon += '<div class="col-sm-3 col-md-3 col-lg-3 no-bg"></div>'
                }
                $("#indexsoft").append(softboxcon);
            }
            $("#indexsoft").dragsort({ dragSelector: ".spanmove", dragBetween: true, dragEnd: saveOrder, placeHolderTemplate: "<div class='col-sm-3 col-md-3 col-lg-3 dashed-border'></div>" });

            function saveOrder() {
                var data = $("#indexsoft > div").map(function () { return $(this).attr("data-id"); }).get();
                data = data.join('|');
                bt.soft.set_sort_index(data)
            };
        })
    },
    check_update: function () {
        bt.system.check_update(function (rdata) {
            if (rdata.status === false) {
                layer.confirm(rdata.msg, { title: lan.index.update_check, icon: 1, closeBtn: 2, btn: [lan.public.know, lan.public.close] });
                return;
            }
            if (rdata.version != undefined) {
                var loading = bt.open({
                    type: 1,
                    title: lan.index.update_to + '[' + rdata.version + ']',
                    area: '400px',
                    shadeClose: false,
                    closeBtn: 2,
                    content: '<div class="setchmod bt-form pd20 pb70"><p style="padding: 0 0 10px;line-height: 24px;">' + rdata.updateMsg + '</p><div class="bt-form-submit-btn"><button type="button" class="btn btn-danger btn-sm btn-title" onclick="layer.closeAll()">' + lan.public.cancel + '</button><button type="button" class="btn btn-success btn-sm btn-title btn_update_panel" >' + lan.index.update_go + '</button></div></div>'
                });
                setTimeout(function () {
                    $('.btn_update_panel').click(function () {
                        loading.close();
                        bt.system.to_update(function (rdata) {
                            if (rdata.status) {
                                bt.msg({ msg: lan.index.update_ok, icon: 1 })
                                $("#btversion").html(rdata.version);
                                $("#toUpdate").html('');
                                bt.system.reload_panel();
                                setTimeout(function () { window.location.reload(); }, 3000);
                            }
                            else {
                                bt.msg({ msg: rdata.msg, icon: 5, time: 5000 });
                            }
                        })
                    })
                }, 100)
            }
        })
    },
    re_panel: function () {
        layer.confirm(lan.index.rep_panel_msg, { title: lan.index.rep_panel_title, closeBtn: 2, icon: 3 }, function () {
            bt.system.rep_panel(function (rdata) {
                if (rdata.status) {
                    bt.msg({ msg: lan.index.rep_panel_ok, icon: 1 });
                    return;
                }
                bt.msg(rdata);
            })
        });
    },
    re_server: function () {
        bt.open({
            type: 1,
            title: '重启服务器或者面板',
            area: '330px',
            closeBtn: 2,
            shadeClose: false,
            content: '<div class="rebt-con"><div class="rebt-li"><a data-id="server" href="javascript:;">重启服务器</a></div><div class="rebt-li"><a data-id="panel" href="javascript:;">重启面板</a></div></div>'
        })
        setTimeout(function () {
            $('.rebt-con a').click(function () {
                var type = $(this).attr('data-id');
                switch (type) {
                    case 'panel':
                        layer.confirm(lan.index.panel_reboot_msg, { title: lan.index.panel_reboot_title, closeBtn: 2, icon: 3 }, function () {
                            var loading = bt.load();
                            interval_stop = true;
                            bt.system.reload_panel(function (rdata) {
                                loading.close();
                                bt.msg(rdata);
                            });
                            setTimeout(function () { window.location.reload(); }, 3000);
                        });
                        break;
                    case 'server':
                        var rebootbox = bt.open({
                            type: 1,
                            title: lan.index.reboot_title,
                            area: ['500px', '280px'],
                            closeBtn: 2,
                            shadeClose: false,
                            content: "<div class='bt-form bt-window-restart'>\
									<div class='pd15'>\
									<p style='color:red; margin-bottom:10px; font-size:15px;'>"+ lan.index.reboot_warning + "</p>\
									<div class='SafeRestart' style='line-height:26px'>\
										<p>"+ lan.index.reboot_ps + "</p>\
										<p>"+ lan.index.reboot_ps_1 + "</p>\
										<p>"+ lan.index.reboot_ps_2 + "</p>\
										<p>"+ lan.index.reboot_ps_3 + "</p>\
										<p>"+ lan.index.reboot_ps_4 + "</p>\
									</div>\
									</div>\
									<div class='bt-form-submit-btn'>\
										<button type='button' class='btn btn-danger btn-sm btn-reboot'>"+ lan.public.cancel + "</button>\
										<button type='button' class='btn btn-success btn-sm WSafeRestart' >"+ lan.public.ok + "</button>\
									</div>\
								</div>"
                        });
                        setTimeout(function () {
                            $(".btn-reboot").click(function () {
                                rebootbox.close();
                            })
                            $(".WSafeRestart").click(function () {
                                var body = '<div class="SafeRestartCode pd15" style="line-height:26px"></div>';
                                $(".bt-window-restart").html(body);
                                $(".SafeRestartCode").append("<p>" + lan.index.reboot_msg_1 + "</p>");
                                bt.pub.set_server_status_by("name={{session['webserver']}}&type=stop", function (r1) {
                                    $(".SafeRestartCode p").addClass('c9');
                                    $(".SafeRestartCode").append("<p>" + lan.index.reboot_msg_2 + "...</p>");
                                    bt.pub.set_server_status_by("name=mysqld&type=stop", function (r2) {
                                        $(".SafeRestartCode p").addClass('c9');
                                        $(".SafeRestartCode").append("<p>" + lan.index.reboot_msg_3 + "...</p>");
                                        bt.system.root_reload(function (rdata) {
                                            $(".SafeRestartCode p").addClass('c9');
                                            $(".SafeRestartCode").append("<p>" + lan.index.reboot_msg_4 + "...</p>");
                                            var sEver = setInterval(function () {
                                                bt.system.get_total(function () {
                                                    clearInterval(sEver);
                                                    $(".SafeRestartCode p").addClass('c9');
                                                    $(".SafeRestartCode").append("<p>" + lan.index.reboot_msg_5 + "...</p>");
                                                    setTimeout(function () {
                                                        layer.closeAll();
                                                    }, 3000);
                                                })
                                            }, 3000);
                                        })
                                    })
                                })
                            })
                        }, 100)
                        break;
                }
            })
        }, 100)
    },
    open_log: function () {
        bt.open({
            type: 1,
            area: '640px',
            title: lan.index.update_log,
            closeBtn: 2,
            shift: 5,
            shadeClose: false,
            content: '<div class="DrawRecordCon"></div>'
        });
        $.get('https://www.bt.cn/Api/getUpdateLogs?type=' + bt.os, function (rdata) {
            var body = '';
            for (var i = 0; i < rdata.length; i++) {
                body += '<div class="DrawRecord DrawRecordlist">\
							<div class="DrawRecordL">'+ rdata[i].addtime + '<i></i></div>\
							<div class="DrawRecordR">\
								<h3>'+ rdata[i].title + '</h3>\
								<p>'+ rdata[i].body + '</p>\
							</div>\
						</div>'
            }
            $(".DrawRecordCon").html(body);
        }, 'jsonp');
    },
    get_cloud_list: function () {
        $.post('/plugin?action=get_soft_list', { type: 8, p: 1, force: 1, cache: 1 }, function (rdata) {
            console.log("已成功从云端获取软件列表");
        });
    }
}
index.get_init();
setTimeout(function () { index.get_cloud_list() }, 800);