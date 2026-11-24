export default class UsuarioObtenerDTO {
  #id;
  #dpi;
  #nombre;
  #email;
  #telefono;
  #activo;
  #creadoEn;

  // Adapta los nombres de las columnas a la representación pública de la API.
  constructor(data) {
    this.#id = data.id;
    this.#dpi = data.dpi;
    this.#nombre = data.nombre;
    this.#email = data.email;
    this.#telefono = data.telefono;
    this.#activo = data.activo;
    this.#creadoEn = data.creado_en;
  }

  // Los setters facilitan actualizar el DTO sin exponer sus campos privados.
  set identificacion(id) { this.#dpi = id }
  set nombre(nombre) { this.#nombre = nombre }
  set email(email) { this.#email = email }
  set telefono(telefono) { this.#telefono = telefono }
  set activo(activo) { this.#activo = activo }
  set creadoEn(creadoEn) { this.#creadoEn = creadoEn }

  get identificacion() { return this.#dpi }
  get nombre() { return this.#nombre }
  get email() { return this.#email }
  get telefono() { return this.#telefono }
  get activo() {
    return this.#activo === true || this.#activo === 1 || this.#activo === '1';
  }
  get creadoEn() { return this.#creadoEn }

  // Expone únicamente los campos públicos; nunca incluye la contraseña almacenada.
  get data() {
    return {
      id: this.#id,
      dpi: this.#dpi,
      nombre: this.#nombre,
      email: this.#email,
      telefono: this.#telefono,
      activo: this.activo,
      creadoEn: this.#creadoEn
    }
  }
}


