export default class UsuarioCrearDTO {
  #dpi;
  #nombre;
  #email;
  #telefono;
  #contrasena;

  // Conserva en un solo objeto los datos validados para crear un usuario.
  constructor(data) {
    this.#dpi = data.identificacion;
    this.#nombre = data.nombre;
    this.#email = data.email;
    this.#telefono = data.telefono ?? null;
    this.#contrasena = data.contrasena;
  }

  // Estos accesores mantienen los nombres del modelo interno separados del JSON recibido.
  set identificacion(id) { this.#dpi = id }
  set nombre(nombre) { this.#nombre = nombre }
  set email(email) { this.#email = email }
  set telefono(telefono) { this.#telefono = telefono }
  set contrasena(contrasena) { this.#contrasena = contrasena }

  get identificacion() { return this.#dpi }
  get nombre() { return this.#nombre }
  get email() { return this.#email }
  get telefono() { return this.#telefono }
  get contrasena() { return this.#contrasena }
}