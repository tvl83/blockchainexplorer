### Setup
Clone the repository and run npm install.

I recommend using nodemon which you can install with `npm i nodemon -g`

I also use tmux so that I can have one window split and run multiple processes

`sudo apt-get install tmux`

with tmux install you can type `tmux` and it'll look like the same console but it's a separate process. You can use `ctrl+b, "` to split the window horizontally.

use `ctrl+b, %` to split the pane vertically.

I usually split it horizontal then make sure I am in the bottom pane and split it vertically.

You can use `ctrl+b` and the directional arrows to navigate to different panes.

Tmux is pretty awesome to allow multiple things running in a single view.

mongodb needs to be installed as well. I recomment following https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-mongodb-on-ubuntu-16-04

After everything is set up be sure to change all the information in `config.json` to your own settings.

##### Sept 28, 2017 Notes

 Right now the major problem is with getting the information from the wallet to the db.

 You can see how I am doing it in the `import.json` file

 I have several commands set up using the `optimist` npm package to allow commandline arguments.

 To just save blocks and ALL required information for those blocks run
 `node import.js --cmd=saveblocks --start=1 --count=250` Right now 250 is a safe amount to run initially. You simply cannot run the entire blockchain in one go.

 After that's all complete you can run

 `node import.js --cmd=calculateaddressbalances` which will go through each address and update their balances and rank and save it to the database.

 I am currently trying to make it a 2-step process. First read in from the iond the blocks and transactions. I can easily run 500 or so in a single command and then with the command I can continue at 501 to get another chunk of 500.

 I think the limiting factor is running so many commands against the iond, so quickly. It's just in a loop and it can be run extremely fast. Also remember that for each 500 blocks there are 500+ transactions so it's doing 1000+ calls on the iond very quickly.

 I routinely get socket hangup errors and have to restart the iond.

 To try the two step process run `node import --cmd=saveblocksonly --count=500`

 the second step is `node import --cmd=pavv --end=500` would run from 1 to 500 if you run less than there are blocks/txs you can run pavv (pavv = **P**rocess**A**ddress**V**outs**V**ins) with a `--start=2` argument. With anything greater than 1 for the start argument it looks at the very last vin in the db and adds 1 and starts from there.

 What I am finding out is that if I have 500 blocks/txs and then do pavv `--end=100` then `--start=2 --end=200` it is doubling the data on the first 100 transactions instead of skipping them for some reason.

### Other Notes

With the API server running (`nodemon apiserver.js`) and `npm start` also running you need to run `http://<your IP here>:3001/ionmarketinfo?force=true` to gather the market info for the first time. It'll run again for every page request if the data is more than 5 minutes old.

## TODO

9/28/2017 source: https://github.com/ionomy/ion/wiki/ionomy-Bounty-Information
**Delivered options must include:** All historical block extraction information ( ~~Latest Blocks~~ , ~~block times~~, daily block count), ~~richlist~~, ~~active network/client/nodes~~, address tagging, inflation information.

- Daily block count is another part I still have to build and is pretty straight forward.
- Inflation information. I am not entirely sure how to calculate this information. I am pretty sure it's the rate at which coins are created.
- Address Tagging. This is already set up in the mongoose schema's and the functionality is built into the wallet. Creating the functions for this will be easy and quick. I cannot test it until the blockchain is up to date, though because I need to have an address that I own to be able to sign a message.

### Complete

- **Latest Blocks** are on the index page and one can visit the block by height and by hash
  - Transactions are also listed and linked to by hash
  - Addresses can be visited and viewed with `/address/<address>`
- **Block times** are included in the latest blocks list
- Balances are updated for a given address on the fly when new blocks affect a specific address. A `calculatebalances` function is ran every night to update **richlist** rankings
- **active network/client/nodes** list is available. It is similar to chainz and has information on the latest nodes that have connected to my node within the last 24 hours. Every 5 minutes it checks `getpeerinfo` and updates information in the database. After 24 hours if a given IP address is not updated it will be removed.

