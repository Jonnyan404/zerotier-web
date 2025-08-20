# ZeroTier 信息展示面板（Cloudflare Worker / Docker 可部署）

说明（中文）：本仓库提供一个最小化的 ZeroTier 节点信息展示面板示例，方便查看状态的小玩具.


![](https://github.com/Jonnyan404/zerotier-web/blob/main/demo.png)

功能
- 以列表形式展示：节点、IP、远程IP、最后在线、版本号
- 手机/PC 自适应
- PWA 支持


## 部署教程:

必要条件:
- nodejs >= 22
- linux 环境
- 去 https://my.zerotier.com/account 获取 API Access Tokens
- 在 https://my.zerotier.com/network 获取 Network ID

### CF workers

```
git clone https://github.com/Jonnyan404/zerotier-web
cd worker
bash deploy_cf.sh
```


### docker

`docker run -d --name=zeroter-web -p 3000:3000 -e ZT_API_TOKEN=xxx -e ZT_NETWORK_ID=yyy jonnyan404/zerotier-web`

- BIND_ADDRESS=0.0.0.0 #自定义绑定IP(默认0.0.0.0)
- PORT=3000 #自定义端口(默认3000)
- UI_PASSWORD=your_password #自定义访问密码(默认无)


### docker-compose

```
name: zerotier-web
services:
    zerotier-web:
        restart: always
        container_name: zerotier-web
        ports:
            - 3000:3000
        environment:
            - ZT_API_TOKEN=your_api_token
            - ZT_NETWORK_ID=your_network_id
            - PORT=3000
            - UI_PASSWORD=your_password
            - BIND_ADDRESS=0.0.0.0
        image: jonnyan404/zerotier-web
```