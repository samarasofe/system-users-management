//File Reader é uma API nativa do JS util para ler e manipular arquivos e pastas
// sessionStorage.setItem é uma API WEB que armazena dados na sessão do usuário. a informação só se perde se o usuario fechar a janela ou aba do browser, mas se mantem se um F5 for pressionado. Ele grava e recupera informação.
// element.innerHTML retorna um valor em html
class UserController {

    //O construtor diz quais parametros devem ser usados ao instanciar uma classe

    constructor(formIdCreate, formIdUpdate, tableId) {  //Passando como parâmetro o ID do form 

        this.formEl = document.getElementById(formIdCreate);
        this.formUpdateEl = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();

    }

    onEdit() {

        document.querySelector("#box-user-update .btn-cancel").addEventListener("click", e => {

            this.showPanelCreate();

        });

        this.formUpdateEl.addEventListener("submit", event => {

            event.preventDefault();

            let btn = this.formUpdateEl.querySelector("[type=submit]");

            btn.disable = true;

            let values = this.getValues(this.formUpdateEl);

            let index = this.formUpdateEl.dataset.trIndex;

            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values); // Object.assign copia o valor de atributos de um objeto, e retorna esse objeto, (a variavel da diretia substituirá a da esquerda)

            this.getPhoto(this.formUpdateEl).then(
                (content) => {

                    if (!values._photo) {
                        result._photo = userOld._photo;
                    } else { 
                        result._photo = content;
                    }

                    let user = new User();

                    user.loadFromJSON(result);

                    user.save();

                    this.getTr(user, tr);

                    this.updateCount();

                    values.photo = content;

                    this.formUpdateEl.reset();

                    this.showPanelCreate();

                    btn.disable = false;

                },
                (e) => {
                    console.error(e);

                }
            );

        });

    }

    onSubmit() {

        this.formEl.addEventListener("submit", event => { //selecionou o id do form adicionando um evento quando o botão de enviar for cliclado

            event.preventDefault();  //Impedi que um link abra a URL

            let btn = this.formEl.querySelector("[type=submit]");

            btn.disable = true;

            let values = this.getValues(this.formEl);

            if (!values) return false;

            this.getPhoto(this.formEl).then(
                (content) => {
                    values.photo = content;

                    values.save();

                    this.addLine(values);

                    this.formEl.reset();


                    btn.disable = false;

                },
                (e) => {
                    console.error(e);

                }
            );

        });

    }

    getPhoto(formEl) {

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader();  //FileReader é uma função nativa do JS ao usar o new, ja invoca o método constructor do método;

            let elements = [...formEl.elements].filter(item => { //array filter é um método nativo do js e após filtrado gera novo array 

                if (item.name === 'photo') {
                    return item;
                }
            });

            let file = elements[0].files[0];

            fileReader.onload = () => {  //Método onload executa a callback quando terminar de carregar o arquivo.

                resolve(fileReader.result);

            };

            fileReader.onerror = (e) => {

                reject(e);
            };

            if (file) {

                fileReader.readAsDataURL(file)

            } else {
                resolve('dist/img/boxed-bg.jpg');
            };

        });

    }

    //Callback é uma função usada como retorno, normalmente anônima, que é executada após terminar de executar um ação.

    getValues(formEl) {

        let user = {};
        let isValid = true;

        [...formEl.elements].forEach(function (field, index) {  //Operador Spread

            if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {

                field.parentElement.classList.add('has-error');
                isValid = false;

            }

            if (field.name == "gender") {

                if (field.checked) { // Valida qual genero está selecionado no form
                    user[field.name] = field.value;  //grava o item no JSON
                }

            } else if (field.name == "admin") {

                user[field.name] = field.checked;

            } else {

                user[field.name] = field.value; //Grava a chave e valor no JSON user

            }

        });

        if (!isValid) {
            return false;
        }

        return new User(
            user.name,
            user.gender,
            user.birth,
            user.country,
            user.email,
            user.password,
            user.photo,
            user.admin
        );


    } //Fechando método getValues


    selectAll() {

        let users = User.getUsersStorage();

        users.forEach(dataUser => {

            let user = new User();

            user.loadFromJSON(dataUser);

            this.addLine(user);
        })

    }

    // Adiciona nova linha tr
    addLine(dataUser) {

        let tr = this.getTr(dataUser);      

        this.tableEl.appendChild(tr);

        this.updateCount();

    }

    getTr(dataUser, tr = null) {

        if (tr === null) tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
            <tr>
                <td><img src= ${dataUser.photo} alt="User Image" class="img-circle img-sm"></td>
                <td>${dataUser.name}</td>
                <td>${dataUser.email}</td>
                <td>${(dataUser.admin) ? 'Yep' : 'Nope'}</td>
                <td>${Utils.dateFormat(dataUser.register)}</td>
                <td>
                    <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                    <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
                </td>
            </tr>
        `;

        this.addEventsTr(tr);

        return tr;

    }

    addEventsTr(tr) {

        tr.querySelector(".btn-delete").addEventListener("click", e => {
            
            if (confirm("Olá humano, você deseja realmente excluir?")) {

                let user = new User();

                user.loadFromJSON(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.updateCount();

            }

         });


        tr.querySelector(".btn-edit").addEventListener("click", e => {

            let json = JSON.parse(tr.dataset.user);  //JSON.parse interpreta uma string converte em Objeto JSON.

            this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) { //For in é um laço

                let field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "]");

                if (field) {

                    switch (field.type) {
                        case 'file':
                            continue; //continue ignora o restante das instruções e avança                        

                        case 'radio':
                            field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "][value=" + json[name] + "]");
                            field.checked = true;
                            break;

                        case 'checkbox':
                            field.checked = json[name];
                            break;

                        default:
                            field.value = json[name];
                    }

                }

            }

            this.formUpdateEl.querySelector(".photo").src = json._photo;

            this.showPanelUpdate();

        });
    }

    showPanelCreate() {

        document.querySelector('#box-user-create').style.display = "block";
        document.querySelector('#box-user-update').style.display = "none";

    }

    showPanelUpdate() {
        document.querySelector('#box-user-create').style.display = "none";
        document.querySelector('#box-user-update').style.display = "block";

    }

    updateCount() {

        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr => {

            numberUsers++;

            let user = JSON.parse(tr.dataset.user); //DataSet é um APIWEB que permite colocar atributos dentro de elementos no HTML

            if (user._admin) numberAdmin++

        });

        document.querySelector("#number-users").innerHTML = numberUsers;
        document.querySelector("#number-users-admin").innerHTML = numberAdmin;
    }

}