#!/bin/sh

sh <(curl 'https://ash-hq.org/install/cns?install=phoenix') \
    && cd cns && mix igniter.install ash ash_phoenix \
    ash_postgres ash_authentication \
    ash_authentication_phoenix ash_admin ash_oban oban_web \
    ash_events ash_archival tidewave ash_paper_trail ash_ai \
    cloak ash_cloak usage_rules ash_typescript ash_money \
    --auth-strategy password --auth-strategy magic_link \
    --framework react --setup --yes
