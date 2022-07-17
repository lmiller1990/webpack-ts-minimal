import { TreeNode } from './src/js/TreeNode'
import * as utils from './src/js/Util'
 import {parseList, parseMethods} from './src/js/TreeNode'



import './index.css'
const greeting: string = 'Hello world'

const el = document.createElement('div')
el.innerText = greeting
document.body.appendChild(el)



let vm_data = {
    'currentTree': undefined,
    'treeProperties': {}
}

let sourceCode =
    `- Programming
something I love
  - Web Development
    - Front-end development
(stuff for the browsers)
      - Languages
        - HTML
        - CSS
        - JavaScript
      - Tools
        - Bootstrap
    - Back-end development
(stuff for the server)
      - Languages
        - PHP
        - Python
      - Frameworks
        - Django
        - Symphony
  - Desktop development,
which is something pretty hard that
most web developers can't do
ahsdlkjhaslkdhjaslkdjhasd
aslñdjhalskdjhalskdjhaskldj
    - Something
    - Something
  - Mobile development
    - Android
    - iOS
    - Some other stuff
no one cares about
    - LOLWAT
`;

// let items = parseList(sourceCode)
let pm = new parseMethods(sourceCode)
pm.parseSource()

// let tn = new TreeNode(sourceCode,true)
// tn.draw('red')
