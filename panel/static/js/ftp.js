/**
		 * 取回FTP数据列表
		 * @param {Number} page   当前页
		 */
function getFtp(page,search) {
	if(page == undefined) page = 1
	search = search == undefined ? '':search;
	search = $("#SearchValue").prop("value");
	order = getCookie('order');
	if(order){
		order = '&order=' + order;
	}else{
		order = '';
	}
	var sUrl = '/data?action=getData'
	var data = 'tojs=getFtp&table=ftps&limit=15&p='+page+'&search='+search + order;
	var loadT = layer.load();
	$.post(sUrl,data, function(data){
		layer.close(loadT);
		//构造数据列表
		var Body = '';
		if(data.data == ""){
			Body="<tr><td colspan='7'>当前没有FTP数据</td></tr>";
			$(".dataTables_paginate").hide()
		}
		for (var i = 0; i < data.data.length; i++) {
			if(data.data[i].status == '1'){
				var ftp_status = "<a href='javascript:;' title='停止这个帐号' onclick=\"ftpStop("+data.data[i].id+",'"+data.data[i].name+"')\"><span style='color:#5CB85C'>已启用 </span> <span style='color:#5CB85C' class='glyphicon glyphicon-play'></span></a>";
			}else{
				var ftp_status = "<a href='javascript:;' title='启用这个帐号' onclick=\"ftpStart("+data.data[i].id+",'"+data.data[i].name+"')\"><span style='color:red'>已停用 </span> <span style='color:red;' class='glyphicon glyphicon-pause'></span></a>";;
			}
			Body +="<tr><td><input type='checkbox' onclick='checkSelect();' title='"+data.data[i].name+"' name='id' value='"+data.data[i].id+"'></td>\
					<td>"+data.data[i].name+"</td>\
					<td class='relative'><span class='password' data-pw='"+data.data[i].password+"'>**********</span><span class='glyphicon glyphicon-eye-open cursor pw-ico' style='margin-left:10px'></span><span class='ico-copy cursor btcopy' style='margin-left:10px' title='复制密码' data-pw='"+data.data[i].password+"'></span></td>\
					<td>"+ftp_status+"</td>\
					<td><a class='btlink' title='打开目录' href=\"javascript:openPath('"+data.data[i].path+"');\">"+data.data[i].path+"</a></td>\
					<td><a class='btlinkbed' href='javascript:;' data-id='"+data.data[i].id+"'>" + data.data[i].ps + "</a></td>\
					<td style='text-align:right; color:#bbb'>\
                       <a href='javascript:;' class='btlink' onClick=\"ftpEditSet("+data.data[i].id+",'"+data.data[i].name+"','"+data.data[i].password+"')\">改密 </a>\
                        | <a href='javascript:;' class='btlink' onclick=\"ftpDelete('"+data.data[i].id+"','"+data.data[i].name+"')\" title='删除FTP'>删除</a>\
                    </td></tr>"                 			
		}
		//输出数据列表
		$("#ftpBody").html(Body);
		//输出分页
		$("#ftpPage").html(data.page);
		//备注
		$(".btlinkbed").click(function(){
			var dataid = $(this).attr("data-id");
			var databak = $(this).text();
			$(this).hide().after("<input class='baktext' type='text' data-id='"+dataid+"' name='bak' value='" + databak + "' placeholder='备注信息' onblur='GetBakPost(\"ftps\")' />");
			$(".baktext").focus();
		});
		//复制密码
		btcopy();
		showHidePwd();
	});
}

/**
 *添加FTP帐户
 * @param {Number} type	添加类型
 */
function ftpAdd(type) {
	if (type == 1) {
		var loadT = layer.load({
			shade: true,
			shadeClose: false
		});
		var data = $("#ftpAdd").serialize();
		$.post('/ftp?action=AddUser', data, function(rdata) {
			if (rdata.status) {
				getFtp(1);
				layer.closeAll();
				layer.msg(rdata.msg, {
					icon: 1
				});
			} else {
				getFtp(1);
				layer.closeAll();
				layer.msg(rdata.msg, {
					icon: 5
				});
			}
		});
		return true;
	}
	var defaultPath = $("#defaultPath").html();
	var index = layer.open({
		type: 1,
		skin: 'demo-class',
		area: '500px',
		title: '添加FTP帐户',
		closeBtn: 2,
		shift: 5,
		shadeClose: false,
		content: "<form class='bt-form pd20 pb70' id='ftpAdd'>\
					<div class='line'>\
					<span class='tname'>用户名</span>\
					<div class='info-r'><input class='bt-input-text' type='text' id='ftpUser' name='ftp_username' style='width:340px' /></div>\
					</div>\
					<div class='line'>\
					<span class='tname'>密码</span>\
					<div class='info-r'><input class='bt-input-text mr5' type='text' name='ftp_password' id='MyPassword' style='width:340px' value='"+(RandomStrPwd(10))+"' /><span title='随机密码' class='glyphicon glyphicon-repeat cursor' onclick='repeatPwd(10)'></span></div>\
					</div>\
					<div class='line'>\
					<span class='tname'>根目录</span>\
					<div class='info-r'><input id='inputPath' class='bt-input-text mr5' type='text' name='path' value='"+defaultPath+"/' placeholder='帐户根目录，会自动创建同名目录'  style='width:340px' /><span class='glyphicon glyphicon-folder-open cursor' onclick='ChangePath(\"inputPath\")'></span><p class='c9 mt10'>FTP所指向的目录</p></div>\
					</div>\
                    <div class='line' style='display:none'>\
					<span class='tname'>备注</span>\
					<div class='info-r'>\
					<input class='bt-input-text' type='text' name='ps' value='' placeholder='备注信息(小于255个字符)' />\
					</div></div>\
					<div class='bt-form-submit-btn'>\
						<button type='button' class='btn btn-danger btn-sm btn-title' onclick='layer.closeAll()'>取消</button>\
				        <button type='button' class='btn btn-success btn-sm btn-title' onclick=\"ftpAdd(1)\" >提交</button>\
			        </div>\
			      </form>"
	});
	
	
	$("#ftpUser").keyup(function()
	{
		var ftpName = $(this).val();
		if($("#inputPath").val().substr(0,11) == '/www/wwwroo' )
		{
			$("#inputPath").val('/www/wwwroot/'+ftpName);
		}
	});
}


/**
 * 删除FTP帐户
 * @param {Number} id 
 * @param {String} ftp_username  欲被删除的用户名
 * @return {bool}
 */
function ftpDelete(id,ftp_username){
	SafeMessage("删除["+ftp_username+"]","您真的要删除["+ftp_username+"]吗?",function(){
		layer.msg('正在删除,请稍候...',{icon:16,time:0,shade: [0.3, '#000']});
		var data='&id='+id+'&username='+ftp_username;
		$.post('/ftp?action=DeleteUser',data,function(rdata){
			layer.closeAll();
			if(rdata['status'] == true){
				getFtp(1);
				layer.msg(rdata.msg,{icon:1});
			}else{
				layer.msg(rdata.msg,{icon:2});
			}
		});
	});
}


//批量删除
function allDeleteFtp(){
	var checkList = $("input[name=id]");
	var dataList = new Array();
	for(var i=0;i<checkList.length;i++){
		if(!checkList[i].checked) continue;
		var tmp = new Object();
		tmp.name = checkList[i].title;
		tmp.id = checkList[i].value;
		dataList.push(tmp);
	}
	SafeMessage("批量删除FTP","<a style='color:red;'>您共选择了["+dataList.length+"]个FTP,删除后将无法恢复,真的要删除吗?</a>",function(){
		layer.closeAll();
		syncDeleteFtp(dataList,0,'');
	});
}

//模拟同步开始批量删除
function syncDeleteFtp(dataList,successCount,errorMsg){
	if(dataList.length < 1) {
		layer.msg("成功删除["+successCount+"]个FTP帐户!",{icon:1});
		return;
	}
	var loadT = layer.msg('正在删除['+dataList[0].name+'],请稍候...',{icon:16,time:0,shade: [0.3, '#000']});
	$.ajax({
			type:'POST',
			url:'/ftp?action=DeleteUser',
			data:'id='+dataList[0].id+'&username='+dataList[0].name,
			async: true,
			success:function(frdata){
				layer.close(loadT);
				if(frdata.status){
					successCount++;
					$("input[title='"+dataList[0].name+"']").parents("tr").remove();
				}else{
					if(!errorMsg){
						errorMsg = '<br><p>以下FTP帐户删除失败:</p>';
					}
					errorMsg += '<li>'+dataList[0].name+' -> '+frdata.msg+'</li>'
				}
				
				dataList.splice(0,1);
				syncDeleteFtp(dataList,successCount,errorMsg);
			}
	});
}

//同步
function SyncTo()
{
	var index = layer.open({
			type: 1,
			skin: 'demo-class',
			area: '300px',
			title: '同步FTP',
			closeBtn: 2,
			shift: 5,
			shadeClose: false,
			content: "<br><button class='btn btn-default' onclick='goSet(1)'>同步选中用户</button><br><br>\
						<button class='btn btn-default' onclick='FtpToLocal()'>同步所有用户</button><br><br>\
						<button class='btn btn-default' onclick='FtpToCloud()'>获取服务器上的用户</button><br><br>"
		});
}

//同步到服务器
function FtpToLocal(){
	layer.confirm('将FTP列表同步到服务器？', {
		title:false,icon:3,
		closeBtn:2,
	    time: 0, 
	    btn: ['确定', '取消']  
    },function(){
		var loadT =layer.msg('正在连接服务器，请稍候...', {icon: 16,time:20000});
		$.post('/Api/SyncData?arg=FtpToLocal','',function(rdata){
			layer.closeAll();
			layer.msg(rdata.msg,{icon:rdata.status?1:2});
		})
	 },function(){
    	layer.closeAll();
    });
}

//从服务器上获取
function FtpToCloud(){
	layer.confirm('您确定要获取么？', {
		title:false,icon:3,
		closeBtn:2,
        time: 0, 
        btn: ['确定', '取消']   
    },function(){
    	var loadT =layer.msg('正在连接服务器，请稍候...', {icon: 16,time:20000});
		$.post('/Api/SyncData?arg=FtpToCloud','',function(rdata){
			layer.closeAll();
			layer.msg(rdata.msg,{icon:rdata.status?1:2});
		})
    },function(){
    	layer.closeAll();
    });
}



/**
 * 选中项操作
 */
function goSet(num){
	//取选中对象
	var el = document.getElementsByTagName('input');
	var len = el.length;
	var data='';
	var a = '';
	var count = 0;
	//构造POST数据
	for(var i=0;i<len;i++){
		if(el[i].checked == true && el[i].value != 'on'){
			data += a+count+'='+el[i].value;
			a = '&';
			count++;
		}
	}
	//判断操作类别
	if(num==1){
		reAdd(data);
	}
	else if(num==2){
		shift(data);
	}
}

function reAdd(data,type){
	if(data == ''){
		layer.msg('请选择至少一个FTP帐户作为操作对象',{icon:2});
		return;
	}
	if(type == 1){
		var ssid = $("#server").prop('value');
		data = data+'&ssid='+ssid;
		var str = '转移FTP帐户操作不可逆，您真的要转移选定FTP帐户到目标服务器吗？';
	}else{
		var str = '即将把您选定的FTP帐户进行重新添加，若FTP帐户在服务器上已存在，此操作将会失败！您真的要同步吗？';
	}
	layer.confirm(str,{icon:3,closeBtn:2},function(index) {
		if(index <= 0){
			layer.closeAll();
			return;
		}
		var loadT=layer.load({shade:true,shadeClose:false});
		$.post('/Ftp/reAdd',data,function(retuls){
			if(retuls > 0){
				layer.closeAll();
				layer.msg('成功处理 '+retuls+'个FTP帐户',{icon:1});
			}else{
				layer.closeAll();
				layer.msg('操作失败，该FTP已存在!',{icon:2});
			}
			
		});
	});
}

/**
 * 停止FTP帐号
 * @param {Number} id	FTP的ID
 * @param {String} username	FTP用户名
 */
function ftpStop(id, username) {
	layer.confirm("您真的要停止" + username + "的FTP吗?", {
		title: 'FTP服务',icon:3,
		closeBtn:2
	}, function(index) {
		if (index > 0) {
			var loadT = layer.load({shade: true,shadeClose: false});
			var data='id=' + id + '&username=' + username + '&status=0';
			$.post('/ftp?action=SetStatus',data, function(rdata) {
				layer.close(loadT);
				if (rdata.status == true) {
					layer.msg(rdata.msg, {icon: 1});
					getFtp(1);
				} else {
					layer.msg(rdata.msg, {icon: 5});
				}
			});
		} else {
			layer.closeAll();
		}
	});
}
/**
 * 启动FTP帐号
 * @param {Number} id	FTP的ID
 * @param {String} username	FTP用户名
 */
function ftpStart(id, username) {
	var loadT = layer.load({shade: true,shadeClose: false});
	var data='id=' + id + '&username=' + username + '&status=1';
	$.post('/ftp?action=SetStatus',data, function(rdata) {
		layer.close(loadT);
		if (rdata.status == true) {
			layer.msg(rdata.msg, {icon: 1});
			getFtp(1);
		} else {
			layer.msg(rdata.msg, {icon: 5});
		}
	});
}

/**
 * 修改FTP帐户信息
 * @param {Number} type 修改类型
 * @param {Number} id	FTP编号
 * @param {String} username	FTP用户名
 * @param {String} statu	FTP状态
 * @param {String} group	FTP权限
 * @param {String} passwd	FTP密码
 */
function ftpEditSet(id, username, passwd) {
	if (id != undefined) {
		var index = layer.open({
			type: 1,
			skin: 'demo-class',
			area: '300px',
			title: '修改FTP用户密码',
			closeBtn: 2,
			shift: 5,
			shadeClose: false,
			content: "<form class='bt-form pd20 pb70' id='ftpEditSet'>\
						<div class='line'>\
						<input type='hidden' name='id' value='" + id + "'/>\
						<input type='hidden' name='ftp_username' value='" + username + "'/>\
						<span class='tname'>用户名:</span><div class='info-r'><input class='bt-input-text' type='text' name='myusername' value='" + username + "' disabled  style='width:100%'/></div></div>\
						<div class='line'>\
						<span class='tname'>新密码:</span><div class='info-r'><input class='bt-input-text' type='text' name='new_password' value='" + passwd + "' style='width:100%' /></div>\
						</div>\
				        <div class='bt-form-submit-btn'>\
							<button type='button' class='btn btn-danger btn-sm btn-title' onclick='layer.closeAll()'>取消</button>\
					        <button type='button' class='btn btn-success btn-sm btn-title' onclick='ftpEditSet()' >提交</button>\
				        </div>\
				      </form>"
		});
	} else {
		layer.confirm("您确定要修改该FTP帐户密码吗?", {
			title: 'FTP服务',icon:3,
			closeBtn:2
		}, function(index) {
			if (index > 0) {
				var loadT = layer.load({
					shade: true,
					shadeClose: false
				});
				var data = $("#ftpEditSet").serialize();
				$.post('/ftp?action=SetUserPassword', data, function(rdata) {
					if (rdata == true) {
						getFtp(1);
						layer.closeAll();
						layer.msg('操作成功', {
							icon: 1
						});
					} else {
						getFtp(1);
						layer.closeAll();
						layer.msg('操作失败', {
							icon: 5
						});
					}

				});
			}
		});
	}
}

/**
 *修改FTP服务端口
 */
function ftpPortEdit(port) {
	layer.open({
		type: 1,
		skin: 'demo-class',
		area: '300px',
		title: '修改FTP端口',
		closeBtn: 2,
		shift: 5,
		shadeClose: false,
		content: "<div class='bt-form pd20 pb70' id='ftpEditSet'>\
					<div class='line'><input id='ftp_port' class='bt-input-text' type='text' name='ftp_port' value='" + port + "' style='width:100%' /></div>\
			        <div class='bt-form-submit-btn'>\
						<button type='button' class='btn btn-danger btn-sm btn-title' onclick='layer.closeAll()'>取消</button>\
				        <button id='poseFtpPort' type='button' class='btn btn-success btn-sm btn-title'>提交</button>\
			        </div>\
			      </div>"
	});
	 $("#poseFtpPort").click(function(){
	 	var NewPort = $("#ftp_port").val();
	 	ftpPortPost(NewPort);
	 })
	 $("#ftp_port").focus().keyup(function(e){
		if(e.keyCode == 13) $("#poseFtpPort").click();
	});
}
//修改FTP服务端口
function ftpPortPost(port){
	layer.closeAll();
	var loadT = layer.msg('正在处理...',{icon:16,time:0,shade: [0.3, '#000']});
	var data='port=' + port;
	$.post('/ftp?action=setPort',data, function(rdata) {
		layer.close(loadT)
		layer.msg(rdata.msg,{icon:rdata.status?1:2})
		setTimeout(function(){
			window.location.reload()	
		},3000)
		
	});
}