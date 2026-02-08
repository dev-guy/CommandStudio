This project was created using the [Ash Installer](https://ash-hq.org) that output the following command.

sh <(curl 'https://ash-hq.org/install/cs?install=phoenix') \
    && cd cns && mix igniter.install ash ash_phoenix \
    ash_postgres ash_authentication \
    ash_authentication_phoenix ash_admin ash_oban oban_web \
    cloak ash_cloak usage_rules ash_typescript \
    --auth-strategy password --auth-strategy magic_link \
    --framework react --setup --yes

