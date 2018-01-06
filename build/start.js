import * as nfs from './modules/nfs'
import * as k8s from './modules/kubernetes'
import * as netstat from './modules/netstat'
import * as nodes from './modules/nodes'
import * as monitor from './modules/monitor'
import * as proxy from './modules/proxy'

const STORAGE_SYS = 'NFS'
const STORAGE_IP = '10.20.0.82'
const K8S_MASTER_IP = '10.20.0.57'
const K8S_NODE_IP = ['10.20.0.66', '10.20.0.56', '10.20.0.63', '10.20.0.53']
const STORAGE_PATH = '/var/nfsshare'
const REPLICAS = '4'

const main = async () => {
  await k8s.masterConnected(K8S_MASTER_IP)
  await k8s.nodesConnected(K8S_NODE_IP)
  if (STORAGE_SYS === 'NFS') await nfs.connected(K8S_MASTER_IP)
  if (!(await nfs.mounted(STORAGE_IP, STORAGE_PATH))) {
    await nfs.mount(STORAGE_IP, STORAGE_PATH)
    await nfs.copyFile('../env/genesis.json', './env/genesis.json')
    await nfs.copyFile('../env/global.json', './env/global.json')
  }
  if (!(await netstat.check(K8S_MASTER_IP))) {
    await netstat.deployDP()
    await netstat.deploySVC()
    await netstat.test()
  }
  await nodes.deployDP(REPLICAS)
  await monitor.deployDP()
  if (!(await proxy.check(K8S_MASTER_IP))) {
    await proxy.deployDP()
    await proxy.deploySVC()
    await proxy.test(K8S_MASTER_IP)
  }
  console.info('----------------------- information -----------------------'.green)
  console.info(`| * Ethereum Netstat : http://${K8S_MASTER_IP}:30001            |`.green)
  console.info(`| * Ethereum porxy : http://${K8S_MASTER_IP}:30002              |`.green)
  console.info(`| * Get all nodes of data : http://${K8S_MASTER_IP}:30002/nodes |`.green)
  console.info('-----------------------------------------------------------'.green)
}

main()