# MicroRealEstate — cómo usarlo

App de gestión de departamentos para tu papá.
Levantada en **http://localhost:8001** — sin Docker, sin root.

## Arrancar / parar

```bash
cd /home/tuf-arch/Documents/Proyectos/deptos

./mre-local.sh up       # levanta todo (primera vez tarda ~1 min)
./mre-local.sh status   # qué está corriendo
./mre-local.sh down     # detiene los servicios
./mre-local.sh restart  # reinicia
./mre-local.sh logs     # logs de todo
```

## URLs

| Qué | Dónde |
| :--- | :--- |
| Panel del dueño (tu papá) | http://localhost:8001/landlord |
| Portal de inquilinos | http://localhost:8001/tenant |
| Health check | http://localhost:8001/health |

Al entrar por `/landlord` redirige solo a español si la organización está en `es-CO`.
Esta instalación ya quedó configurada en español con una organización llamada
**"Departamentos Papa"**.

## Cuenta de prueba creada

- email: `papa@prueba.local`
- password: `Prueba12345!`

**Cambiala antes de que tu papá la use.** Entrá en Configuración y creale una cuenta
propia; esta quedó como prueba de que el flujo funciona.

## Puertos (por qué el 8001)

| Servicio | Puerto | Nota |
| :--- | :--- | :--- |
| gateway (público) | **8001** | el único que hay que abrir |
| landlord UI | 8180 | interno |
| tenant UI | 8190 | interno |
| authenticator | **8010** | el original era 8000, ocupado por medvet |
| api | 8200 | interno |
| tenantapi | 8250 | interno |
| pdfgenerator | 8300 | genera PDFs con Chrome |
| emailer | 8400 | interno |
| resetservice | 8500 | sólo desarrollo |
| mongod | 27017 | base de datos |
| redis | 6379 | sesiones y tokens |

## Qué falta configurar

**El correo no anda todavía.** Sin SMTP, los recibos, los avisos de renta y el
restablecimiento de contraseña no salen. Se configura en
Configuración → Servicio de correo, una vez que tengas una cuenta de email real
(Gmail con contraseña de aplicación, o un SMTP pago).

Hasta entonces: el panel funciona completo, pero los correos se quedan sin enviar.

## Datos

- Base MongoDB: `~/.local/share/mongodb/data`
- Copia de los secretos: `~/.config/mre/secrets.env`

**Importante:** sin `secrets.env` no se puede volver a iniciar sesión ni descifrar
los datos guardados. No lo borres.

## Si algo no levanta

```bash
./mre-local.sh status                    # ver qué falta
tail -50 logs/<servicio>.log             # log del servicio que falla
```

Los nombres de `logs/` son: `gateway`, `landlord`, `tenant`, `authenticator`,
`api`, `tenantapi`, `pdfgenerator`, `emailer`, `resetservice`.

## Nota sobre reiniciar la máquina

MongoDB y Redis no arrancan solos con el sistema. Después de un reinicio:

```bash
./mre-local.sh up
```

El script los levanta si no están corriendo.