# Welcome to QAgent.

## Setup
The following steps will be given as terminal commands, 
but under them will be a description of what the commands do 

1. - clone the repository into a directory of your choice
2. `cd qagent`
    - go inside the directory
3. `git switch new_ideas`
    - switch to the new_ideas branch

#### Now you have two options depending on the platform you are using

##### macOS
- you can install bun (an alternative to npm) if you want. (It's what I use)
    - `curl -fsSL https://bun.sh/install | bash`
- or you can just keep using npm 
- make sure you read the sidenote about bun at the bottom

##### Windows
- sorry you're stuck with npm, bun isnt supported on windows yet :(

##### Linux
- same as macOS

#### Moving on

5. `git pull`
    - ensure that your local git repository is up-to-date with gitHub 

6. `bun i` OR `npm i --force`
    - install the required packages into your local node_modules folder
    - the --force flag on npm is fine, otherwise it will error with dependency conflicts, 
    but it should be fine to use here (trust me, maybe)

7.  `touch .env`
    - create a file in the root of the qagent directory called .env

9. paste the contents of the environment variable inside this file and save

10. `bun postinstall` OR `npm run postinstall`
    - run the postinstall script (just fetches the adb server binary)
    
11. `bun dev` OR `npm run dev`
    - start up your local development server
    - if there are no errors __You are good to go!__ 



### Sidenote about bun
- to be able to use the `bun` command in your terminal, you may have to   
add it to your path.
- read more [here](https://bun.sh/docs/installation) (scroll down to the `How to add to your PATH section`)





# TODO ( Longer Term )
- look into using a state libary ( like react redux )
- all of the mobile components could use contexts?
